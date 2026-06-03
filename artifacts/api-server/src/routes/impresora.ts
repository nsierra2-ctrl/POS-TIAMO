import { Router, type IRouter } from "express";
import { requireAuth, requireRol } from "../middlewares/auth";
import net from "net";
import { buildTicketPrueba } from "../lib/tickets";
import { buildEscPosPrueba, textToEscPos } from "../lib/escpos";

const router: IRouter = Router();

interface ConfigImpresora {
  modo: "simulado" | "usb" | "wifi" | "ethernet" | "bluetooth";
  ip?: string;
  puerto?: number;
  ssid?: string;
  bluetoothName?: string;
}

let config: ConfigImpresora = { modo: "simulado" };

const logs: Array<{ ts: string; tipo: string; contenido: string; exito: boolean }> = [];
const MAX_LOGS = 50;

function agregarLog(tipo: string, contenido: string, exito: boolean) {
  logs.unshift({ ts: new Date().toISOString(), tipo, contenido, exito });
  if (logs.length > MAX_LOGS) logs.pop();
}

function enviarPorRed(ip: string, puerto: number, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on("timeout", () => { socket.destroy(); reject(new Error("Timeout de conexion")); });
    socket.on("error", (err) => { reject(err); });
    socket.connect(puerto, ip, () => {
      socket.write(data, (err) => {
        if (err) { socket.destroy(); reject(err); return; }
        socket.end();
        resolve();
      });
    });
    socket.on("close", () => {});
  });
}

/** Escanea un rango de IPs buscando impresora termica en puerto 9100 */
async function detectarImpresoraRed(
  subnet: string,
  start: number,
  end: number,
  puerto: number
): Promise<{ ip: string; ms: number } | null> {
  const promises: Promise<{ ip: string; ms: number } | null>[] = [];
  for (let i = start; i <= end; i++) {
    const ip = `${subnet}.${i}`;
    promises.push(
      new Promise((resolve) => {
        const socket = new net.Socket();
        const startTime = Date.now();
        socket.setTimeout(1200);
        socket.on("timeout", () => { socket.destroy(); resolve(null); });
        socket.on("error", () => { socket.destroy(); resolve(null); });
        socket.connect(puerto, ip, () => {
          const ms = Date.now() - startTime;
          socket.destroy();
          resolve({ ip, ms });
        });
      })
    );
  }
  const results = await Promise.all(promises);
  // Devolver la mas rapida
  const found = results.filter(Boolean) as { ip: string; ms: number }[];
  if (!found.length) return null;
  return found.sort((a, b) => a.ms - b.ms)[0];
}

export async function enviarTicketImpresora(
  ticketTexto: string,
  tipo: string,
  escposBinario?: Buffer,
): Promise<{ ok: boolean; modo: string; mensaje: string }> {
  if (config.modo === "simulado") {
    agregarLog(tipo, ticketTexto, true);
    return { ok: true, modo: "simulado", mensaje: "Ticket registrado en modo simulado" };
  }

  if (config.modo === "usb" || config.modo === "bluetooth") {
    agregarLog(tipo, ticketTexto, false);
    return { ok: false, modo: config.modo, mensaje: `Modo ${config.modo}: conecte desde el navegador o sistema operativo.` };
  }

  if (config.ip && config.puerto) {
    try {
      const buf = escposBinario ?? textToEscPos(ticketTexto);
      await enviarPorRed(config.ip, config.puerto, buf);
      agregarLog(tipo, `[ESC/POS ${buf.length} bytes] ${ticketTexto.substring(0, 60)}...`, true);
      return { ok: true, modo: "red", mensaje: `Ticket ESC/POS enviado a ${config.ip}:${config.puerto} (${buf.length} bytes)` };
    } catch (e: any) {
      agregarLog(tipo, ticketTexto, false);
      return { ok: false, modo: "red", mensaje: `Error de red: ${e.message}` };
    }
  }

  agregarLog(tipo, ticketTexto, false);
  return { ok: false, modo: config.modo, mensaje: "Configure la IP y puerto de la impresora." };
}

export function getImpresoraConfig(): ConfigImpresora {
  return config;
}

router.get("/impresora/config", requireAuth, requireRol("admin"), (req, res) => {
  res.json(config);
});

router.post("/impresora/config", requireAuth, requireRol("admin"), (req, res) => {
  const { modo, ip, puerto, ssid, bluetoothName } = req.body;
  const validModes = ["simulado", "usb", "wifi", "ethernet", "bluetooth"];
  if (!validModes.includes(modo)) {
    res.status(400).json({ error: "Modo invalido. Use: simulado, usb, wifi, ethernet, bluetooth" });
    return;
  }
  config = {
    modo,
    ip: ip || undefined,
    puerto: puerto ? parseInt(puerto) : undefined,
    ssid: ssid || undefined,
    bluetoothName: bluetoothName || undefined,
  };
  res.json({ ok: true, config });
});

/** Auto-detectar impresora en red local */
router.post("/impresora/detectar", requireAuth, requireRol("admin"), async (req, res) => {
  const { subnet, start, end, puerto = 9100 } = req.body;
  const subnetsToScan = subnet ? [subnet] : ["192.168.1", "192.168.0", "10.0.0"];
  const results: Array<{ subnet: string; found: { ip: string; ms: number } | null }> = [];

  for (const s of subnetsToScan) {
    const found = await detectarImpresoraRed(s, start ?? 100, end ?? 110, puerto);
    results.push({ subnet: s, found });
    if (found) break; // Parar al encontrar la primera
  }

  const winner = results.find((r) => r.found);
  if (winner?.found) {
    // Auto-configurar si se encontro
    config = {
      ...config,
      modo: config.modo === "simulado" ? "ethernet" : config.modo,
      ip: winner.found.ip,
      puerto: puerto,
    };
    res.json({
      ok: true,
      ip: winner.found.ip,
      puerto,
      ms: winner.found.ms,
      subnet: winner.subnet,
      message: `Impresora detectada en ${winner.found.ip}:${puerto} (${winner.found.ms}ms)`,
      autoConfigured: config.modo !== "simulado",
    });
  } else {
    res.json({
      ok: false,
      message: "No se detecto ninguna impresora termica en los rangos escaneados.",
      scanned: subnetsToScan,
      tip: "Asegurese de que la impresora este encendida, conectada a la red, y que la IP este en el mismo segmento de red que el servidor.",
    });
  }
});

/** Probar conexion directa a una IP sin guardar config */
router.post("/impresora/probar-ip", requireAuth, requireRol("admin"), async (req, res) => {
  const { ip, puerto = 9100 } = req.body;
  if (!ip) {
    res.status(400).json({ error: "Falta IP" });
    return;
  }
  try {
    const testBuf = textToEscPos("PRUEBA DE CONEXION\nTIAMO POS\n");
    await enviarPorRed(ip, puerto, testBuf);
    res.json({ ok: true, message: `Conexion exitosa a ${ip}:${puerto}. Se enviaron ${testBuf.length} bytes de prueba.` });
  } catch (e: any) {
    res.json({ ok: false, error: e.message, tip: "Verifique que la impresora este encendida y en la misma red." });
  }
});

/** Imprimir ticket — disponible para todos los usuarios autenticados */
router.post("/impresora/imprimir", requireAuth, async (req, res) => {
  const { ticket, tipo = "pedido" } = req.body;
  if (!ticket || typeof ticket !== "string") {
    res.status(400).json({ error: "Ticket invalido" });
    return;
  }

  const result = await enviarTicketImpresora(ticket, tipo);
  if (result.ok) {
    res.json({ ok: true, modo: result.modo, mensaje: result.mensaje });
  } else {
    res.status(502).json({ ok: false, modo: result.modo, error: result.mensaje });
  }
});

router.post("/impresora/prueba", requireAuth, requireRol("admin"), async (req, res) => {
  const ticketPrueba = buildTicketPrueba();

  if (config.modo === "simulado") {
    req.log.info("PRUEBA DE IMPRESION SIMULADA");
    agregarLog("prueba", ticketPrueba, true);
    res.json({ ok: true, modo: "simulado", ticket: ticketPrueba });
    return;
  }

  if (config.modo === "usb" || config.modo === "bluetooth") {
    agregarLog("prueba", ticketPrueba, false);
    res.json({ ok: false, modo: config.modo, ticket: ticketPrueba, error: `Modo ${config.modo}: conecte desde el navegador o sistema operativo.` });
    return;
  }

  if (config.ip && config.puerto) {
    try {
      const escposBuf = buildEscPosPrueba();
      await enviarPorRed(config.ip, config.puerto, escposBuf);
      agregarLog("prueba", `[ESC/POS ${escposBuf.length} bytes] Ticket de prueba`, true);
      res.json({ ok: true, modo: "red", mensaje: `Ticket ESC/POS enviado a ${config.ip}:${config.puerto} (${escposBuf.length} bytes)` });
      return;
    } catch (e: any) {
      agregarLog("prueba", ticketPrueba, false);
      res.json({ ok: false, modo: "red", ticket: ticketPrueba, error: `Error de red: ${e.message}` });
      return;
    }
  }

  agregarLog("prueba", ticketPrueba, false);
  res.json({ ok: false, ticket: ticketPrueba, error: "Configure la IP y puerto de la impresora." });
});

router.get("/impresora/logs", requireAuth, requireRol("admin"), (req, res) => {
  res.json(logs);
});

router.delete("/impresora/logs", requireAuth, requireRol("admin"), (req, res) => {
  logs.length = 0;
  res.json({ ok: true });
});

export default router;
