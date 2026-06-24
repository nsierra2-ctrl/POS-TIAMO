import { Router, type IRouter } from "express";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { db, pedidosTable, updatePedidoSchema, itemPedidoSchema, mesasTable, cobrarPedidoSchema, configuracionTable } from "@workspace/db";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";
import { broadcast } from "../lib/broadcast";
import { buildFacturaTicket, buildComandaTicket } from "../lib/tickets";
import { buildEscPosComanda, buildEscPosFactura } from "../lib/escpos";
import { enviarTicketImpresora } from "./impresora";

const modificarItemsSchema = z.object({
  items: z.array(itemPedidoSchema).min(1),
  total: z.number().int().min(0),
  nota: z.string().optional(),
});

const router: IRouter = Router();

const crearPedidoSchema = z.object({
  mesa: z.string().min(1).max(20),
  items: z.array(itemPedidoSchema).min(1),
  total: z.number().int().min(0),
  notas: z.string().optional(),
  meseroId: z.number().int().optional(),
});

function serializePedido(pedido: any) {
  return {
    ...pedido,
    creadoEn: pedido.creadoEn instanceof Date ? pedido.creadoEn.toISOString() : pedido.creadoEn,
    cobradoEn: pedido.cobradoEn instanceof Date ? pedido.cobradoEn.toISOString() : pedido.cobradoEn,
  };
}

router.get("/pedidos/resumen", requireAuth, async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [nuevo, preparando, listo, hoyRows] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(pedidosTable).where(eq(pedidosTable.estado, "nuevo")),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(pedidosTable).where(eq(pedidosTable.estado, "preparando")),
      db.select({ count: sql<number>`cast(count(*) as int)` }).from(pedidosTable).where(eq(pedidosTable.estado, "listo")),
      db.select({ count: sql<number>`cast(count(*) as int)`, ventas: sql<number>`cast(coalesce(sum(total), 0) as int)` })
        .from(pedidosTable)
        .where(gte(pedidosTable.creadoEn, hoy)),
    ]);

    res.json({
      nuevo: nuevo[0]?.count ?? 0,
      preparando: preparando[0]?.count ?? 0,
      listo: listo[0]?.count ?? 0,
      totalHoy: hoyRows[0]?.count ?? 0,
      ventasHoy: hoyRows[0]?.ventas ?? 0,
    });
  } catch (e) {
    req.log.error(e, "Error al obtener resumen");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/pedidos", requireAuth, async (req, res) => {
  try {
    const conditions = [];

    if (req.query.estado) {
      const estadosValidos = ["nuevo", "preparando", "listo", "cobrado", "cancelado"];
      const estados = (req.query.estado as string).split(",").filter((e) => estadosValidos.includes(e));
      if (estados.length === 1) {
        conditions.push(eq(pedidosTable.estado, estados[0] as any));
      }
    }

    if (req.query.mesa) {
      conditions.push(eq(pedidosTable.mesa, req.query.mesa as string));
    }

    const limite = req.query.limite ? parseInt(req.query.limite as string, 10) : 100;

    let query = db.select().from(pedidosTable).orderBy(desc(pedidosTable.creadoEn)).limit(limite);
    if (conditions.length > 0) {
      query = db.select().from(pedidosTable).where(and(...conditions)).orderBy(desc(pedidosTable.creadoEn)).limit(limite) as any;
    }

    const pedidos = await query;
    res.json(pedidos.map(serializePedido));
  } catch (e) {
    req.log.error(e, "Error al obtener pedidos");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/pedidos", requireAuth, async (req, res) => {
  const parsed = crearPedidoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
    return;
  }

  try {
    const usuario = (req as any).usuario;
    const ahora = new Date().toISOString();
    const historialInicial = [{ estado: "nuevo", usuarioId: usuario?.id, usuarioNombre: usuario?.nombre, ts: ahora }];

    const [pedido] = await db
      .insert(pedidosTable)
      .values({
        mesa: parsed.data.mesa,
        items: parsed.data.items,
        total: parsed.data.total,
        notas: parsed.data.notas ?? null,
        meseroId: parsed.data.meseroId ?? null,
        estado: "nuevo",
        metodoPago: "pendiente",
        pagos: [],
        propina: 0,
        historialEstados: historialInicial,
      })
      .returning();

    await db
      .update(mesasTable)
      .set({ estado: "ocupada", actualizadoEn: new Date() })
      .where(eq(mesasTable.numero, parsed.data.mesa));

    // Generar comanda e intentar enviar a impresora
    const itemsTicket = (parsed.data.items ?? []).map((i: any) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio: i.precio,
      observaciones: i.observaciones,
      emoji: i.emoji,
    }));
    const comandaTicket = buildComandaTicket({
      id: pedido.id,
      mesa: parsed.data.mesa,
      items: itemsTicket,
      total: parsed.data.total,
      notas: parsed.data.notas,
      mesero: usuario?.nombre ?? undefined,
      fecha: new Date(pedido.creadoEn),
    });
    // Generar binario ESC/POS para impresora termica real
    const comandaEscPos = buildEscPosComanda({
      id: pedido.id,
      mesa: parsed.data.mesa,
      items: itemsTicket,
      total: parsed.data.total,
      notas: parsed.data.notas,
      mesero: usuario?.nombre ?? undefined,
      fecha: new Date(pedido.creadoEn),
    });
    const impresionComanda = await enviarTicketImpresora(comandaTicket, "comanda", comandaEscPos);

    const result = serializePedido(pedido);
    broadcast("pedido_nuevo", result);
    broadcast("mesas_actualizadas", {});
    res.status(201).json({ ...result, comandaTicket, impresion: impresionComanda });
  } catch (e) {
    req.log.error(e, "Error al crear pedido");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/pedidos/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  try {
    const [pedido] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id));
    if (!pedido) { res.status(404).json({ error: "Pedido no encontrado" }); return; }
    res.json(serializePedido(pedido));
  } catch (e) {
    req.log.error(e, "Error al obtener pedido");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/pedidos/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const parsed = updatePedidoSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }

  try {
    const usuario = (req as any).usuario;
    const [pedidoActual] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id));
    if (!pedidoActual) { res.status(404).json({ error: "Pedido no encontrado" }); return; }

    const historialPrev = Array.isArray(pedidoActual.historialEstados) ? pedidoActual.historialEstados : [];
    const nuevoHistorial = parsed.data.estado ? [
      ...historialPrev,
      { estado: parsed.data.estado, usuarioId: usuario?.id, usuarioNombre: usuario?.nombre, ts: new Date().toISOString(), nota: parsed.data.nota }
    ] : historialPrev;

    const [pedido] = await db
      .update(pedidosTable)
      .set({
        ...(parsed.data.estado ? { estado: parsed.data.estado } : {}),
        ...(parsed.data.notas !== undefined ? { notas: parsed.data.notas } : {}),
        historialEstados: nuevoHistorial,
      })
      .where(eq(pedidosTable.id, id))
      .returning();

    if (!pedido) { res.status(404).json({ error: "Pedido no encontrado" }); return; }

    if (parsed.data.estado === "cancelado") {
      // Cancelado: liberar mesa solo si no quedan pedidos activos
      const pedidosActivos = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(pedidosTable)
        .where(and(
          eq(pedidosTable.mesa, pedido.mesa),
          sql`${pedidosTable.estado} in ('nuevo', 'preparando', 'listo')`,
        ));
      if ((pedidosActivos[0]?.count ?? 0) === 0) {
        await db.update(mesasTable).set({ estado: "libre", personas: 0, actualizadoEn: new Date() }).where(eq(mesasTable.numero, pedido.mesa));
        broadcast("mesas_actualizadas", {});
      }
    } else if (parsed.data.estado === "cobrado") {
      // Cobrado via PATCH: mesa pasa a "en_pago" (pendiente registrar propina y cerrar)
      await db.update(mesasTable).set({ estado: "en_pago", actualizadoEn: new Date() }).where(eq(mesasTable.numero, pedido.mesa));
      broadcast("mesas_actualizadas", {});
    }
    // "listo", "preparando", "nuevo": no cambian estado de mesa

    const result = serializePedido(pedido);
    broadcast("pedido_actualizado", result);
    res.json(result);
  } catch (e) {
    req.log.error(e, "Error al actualizar pedido");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/pedidos/:id/cobrar", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const parsed = cobrarPedidoSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos de pago inválidos", detalles: parsed.error.issues }); return; }

  try {
    const usuario = (req as any).usuario;
    const [pedidoActual] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id));
    if (!pedidoActual) { res.status(404).json({ error: "Pedido no encontrado" }); return; }
    if (pedidoActual.estado === "cancelado") { res.status(400).json({ error: "El pedido fue cancelado" }); return; }

    const { pagos, propina = 0, propinaSugerida = 0, propinaAceptada = 0, nota } = parsed.data;
    const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
    const totalConPropina = pedidoActual.total + propina;
    const cambio = Math.max(0, totalPagado - totalConPropina);

    if (totalPagado < totalConPropina) {
      res.status(400).json({ error: `Monto insuficiente. Total: ${totalConPropina}, pagado: ${totalPagado}` });
      return;
    }

    const metodoPago = pagos.length === 1 ? pagos[0].metodo : "mixto";

    // Generar número de factura
    let numeroFactura: string | null = null;
    try {
      const [cfg] = await db.select().from(configuracionTable).limit(1);
      const prefijo = cfg?.prefijoFactura ?? "F";
      const ultimo = (cfg?.ultimoNumeroFactura ?? 0) + 1;
      numeroFactura = `${prefijo}${String(ultimo).padStart(6, "0")}`;
      await db.update(configuracionTable).set({ ultimoNumeroFactura: ultimo }).where(eq(configuracionTable.id, cfg?.id ?? 1));
    } catch {
      numeroFactura = `F${String(id).padStart(6, "0")}`;
    }

    const historialPrev = Array.isArray(pedidoActual.historialEstados) ? pedidoActual.historialEstados : [];
    const nuevoHistorial = [
      ...historialPrev,
      { estado: "cobrado", usuarioId: usuario?.id, usuarioNombre: usuario?.nombre, ts: new Date().toISOString(), nota: nota ?? `Cobrado: ${pagos.map((p) => `${p.metodo} $${p.monto.toLocaleString("es-CO")}`).join(" + ")}` }
    ];

    const [pedido] = await db.update(pedidosTable).set({
      estado: "cobrado",
      metodoPago: metodoPago as any,
      pagos,
      propina,
      propinaSugerida,
      propinaAceptada,
      propinaRechazada: propinaSugerida > propinaAceptada ? propinaSugerida - propinaAceptada : 0,
      cambio,
      numeroFactura,
      cobradoEn: new Date(),
      cobradoPor: usuario?.id ?? null,
      historialEstados: nuevoHistorial,
    }).where(eq(pedidosTable.id, id)).returning();

    // Mesa pasa a "en_pago": cobrada pero pendiente de registrar propina y cerrar
    await db.update(mesasTable).set({ estado: "en_pago", actualizadoEn: new Date() }).where(eq(mesasTable.numero, pedidoActual.mesa));

    // Generar factura e intentar enviar a impresora
    const itemsArray = Array.isArray(pedidoActual.items) ? pedidoActual.items : [];
    const itemsFactura = itemsArray.map((i: any) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio: i.precio,
      observaciones: i.observaciones,
      emoji: i.emoji,
    }));
    const facturaTicket = buildFacturaTicket({
      id: pedido.id,
      numeroFactura,
      mesa: pedidoActual.mesa,
      items: itemsFactura,
      total: pedidoActual.total,
      notas: pedidoActual.notas ?? undefined,
      mesero: pedidoActual.meseroId ? usuario?.nombre ?? undefined : undefined,
      fecha: new Date(pedido.cobradoEn),
      pagos: pagos.map((p: any) => ({ metodo: p.metodo, monto: p.monto, tipoTarjeta: p.tipoTarjeta, banco: p.banco, referencia: p.referencia })),
      propina,
      totalConPropina,
      cambio,
      metodoPago,
      cobradoPor: usuario?.nombre ?? undefined,
    });
    const facturaEscPos = buildEscPosFactura({
      id: pedido.id,
      numeroFactura,
      mesa: pedidoActual.mesa,
      items: itemsFactura,
      total: pedidoActual.total,
      notas: pedidoActual.notas ?? undefined,
      mesero: pedidoActual.meseroId ? usuario?.nombre ?? undefined : undefined,
      fecha: new Date(pedido.cobradoEn),
      pagos: pagos.map((p: any) => ({ metodo: p.metodo, monto: p.monto, tipoTarjeta: p.tipoTarjeta, banco: p.banco, referencia: p.referencia })),
      propina,
      totalConPropina,
      cambio,
      metodoPago,
      cobradoPor: usuario?.nombre ?? undefined,
    });
    const impresionFactura = await enviarTicketImpresora(facturaTicket, "factura", facturaEscPos);

    const result = serializePedido(pedido);
    broadcast("pedido_actualizado", result);
    broadcast("mesas_actualizadas", {});
    res.json({
      ...result,
      cambio,
      facturaTicket,
      impresion: impresionFactura,
    });
  } catch (e) {
    req.log.error(e, "Error al cobrar pedido");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/pedidos/:id/factura", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [pedido] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id));
    if (!pedido) { res.status(404).json({ error: "Pedido no encontrado" }); return; }

    const cfgRows = await db.select().from(configuracionTable).limit(1);
    const cfgRaw = cfgRows[0] ?? {
      nombreNegocio: "TIAMO BURGER", slogan: "La hamburguesa que te enamora", logoUrl: null as string | null,
      ruc: "", direccion: "", telefono: "", email: "", instagram: "", moneda: "COP", mensajeFactura: "¡Gracias por tu visita!",
    };
    const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const cfg = {
      nombreNegocio: esc(cfgRaw.nombreNegocio), slogan: esc(cfgRaw.slogan), logoUrl: cfgRaw.logoUrl,
      ruc: esc(cfgRaw.ruc), direccion: esc(cfgRaw.direccion), telefono: esc(cfgRaw.telefono),
      email: esc(cfgRaw.email), instagram: esc(cfgRaw.instagram), moneda: cfgRaw.moneda || "COP",
      mensajeFactura: esc(cfgRaw.mensajeFactura),
    };
    const items = Array.isArray(pedido.items) ? (pedido.items as any[]) : [];
    const pagos = Array.isArray(pedido.pagos) ? (pedido.pagos as any[]) : [];
    const fecha = new Date(pedido.cobradoEn ?? pedido.creadoEn).toLocaleString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: cfg.moneda, minimumFractionDigits: 0 }).format(n);

    // Build plain-text factura that fits 58mm thermal printer (30 chars wide)
    const LINE = 30;
    const pad = (l: string, r: string) => l + " ".repeat(Math.max(1, LINE - l.length - r.length)) + r;
    const div = (c = "-") => c.repeat(LINE);
    const ctr = (s: string) => " ".repeat(Math.max(0, Math.floor((LINE - s.length) / 2))) + s;

    const itemLines = items.map((item: any) => {
      const name = `${Number(item.cantidad) || 0}x ${esc(item.nombre)}`;
      const max = LINE - 8;
      const display = name.length > max ? name.substring(0, max - 1) + "." : name;
      const total = formatCOP((item.precio || 0) * (item.cantidad || 0));
      let line = pad(display, total);
      if (item.observaciones) line += `\n  * ${esc(String(item.observaciones).substring(0, LINE - 4))}`;
      return line;
    }).join("\n");

    const pagoLines = pagos.map((p: any) => pad(`${esc(p.metodo)}:`, formatCOP(p.monto || 0))).join("\n");

    const ticketText = [
      div("="), ctr(cfg.nombreNegocio.toUpperCase()), ctr("Sistema POS v3"),
      cfg.telefono ? ctr(`Tel:${cfg.telefono}`) : "",
      div("="), ctr("FACTURA VENTA"),
      ctr(`${pedido.numeroFactura ? `Factura ${pedido.numeroFactura}` : `#${String(pedido.id).padStart(4, "0")}`} Mesa${pedido.mesa}`),
      div("="), fecha,
      `Mesero:${(pedido as any).meseroNombre ?? "-"}`,
      `Cajero:${(pedido as any).cobradoPorNombre ?? "-"}`,
      div("-"), itemLines, div("-"),
      pad("Subtotal:", formatCOP(pedido.total || 0)),
      pedido.propina > 0 ? pad("Propina:", formatCOP(pedido.propina)) : "",
      div("-"), pad("TOTAL:", formatCOP((pedido.total || 0) + (pedido.propina || 0))), div("-"),
      pagoLines,
      (pedido as any).cambio > 0 ? pad("Cambio:", formatCOP((pedido as any).cambio)) : "",
      div("="), ctr(cfg.mensajeFactura || "Gracias por su visita!"), div("="),
    ].filter(Boolean).join("\n");

    const itemsHtml = items.map((item: any) => {
      const qty = Number(item.cantidad) || 0;
      const sub = formatCOP((item.precio || 0) * qty);
      const obs = item.observaciones ? `<div class="obs">&#x21B3; ${esc(String(item.observaciones))}</div>` : "";
      return `<div class="row"><span>${qty}x ${esc(item.nombre)}</span><span>${sub}</span></div>${obs}`;
    }).join("");

    const pagosHtml = pagos.map((p: any) => {
      const label = p.metodo === "efectivo" ? "Efectivo:" : p.metodo === "transferencia" ? "Transferencia:" : esc(p.metodo) + ":";
      return `<div class="row"><span>${label}</span><span>${formatCOP(p.monto || 0)}</span></div>`;
    }).join("");

    const totalFinal = (pedido.total || 0) + (pedido.propina || 0);
    const cambioVal = (pedido as any).cambio ?? 0;

    const html = `<!DOCTYPE html>
<html lang="es"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Factura #${pedido.id} — ${cfg.nombreNegocio}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',Courier,monospace;width:72mm;max-width:72mm;margin:0 auto;padding:6px;color:#000;background:#fff;font-size:13px;line-height:1.6;font-weight:700}
    .center{text-align:center}
    .brand{font-size:22px;font-weight:900;letter-spacing:2px;color:#CC0000;text-transform:uppercase}
    .tagline{font-size:12px;font-weight:700;margin-top:2px}
    .info{font-size:12px;font-weight:700;margin:1px 0}
    .section-title{font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:1px}
    .order-num{font-size:13px;font-weight:700}
    .hr{border:none;border-top:1px dashed #000;margin:5px 0}
    .hr-solid{border:none;border-top:2px solid #000;margin:5px 0}
    .row{display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:13px;margin:3px 0;gap:4px}
    .row span:first-child{flex:1}
    .row span:last-child{white-space:nowrap;font-weight:700}
    .row.big{font-size:18px;font-weight:900;margin:4px 0}
    .obs{font-size:11px;font-weight:700;padding-left:14px;margin-bottom:2px}
    .footer{font-size:14px;font-weight:900;text-align:center;margin-top:4px}
    @media print{@page{margin:0;size:72mm auto}body{width:72mm;padding:2px}.no-print{display:none!important}}
  </style>
</head><body>
  <div class="center">
    <div class="brand">${cfg.nombreNegocio}</div>
    ${cfg.slogan ? `<div class="tagline">${cfg.slogan}</div>` : ""}
    ${cfg.telefono ? `<div class="info">Tel: ${cfg.telefono}</div>` : ""}
    ${cfg.direccion ? `<div class="info">${cfg.direccion}</div>` : ""}
    ${cfg.ruc ? `<div class="info">NIT: ${cfg.ruc}</div>` : ""}
  </div>
  <hr class="hr-solid">
  <div class="center section-title">FACTURA DE VENTA</div>
  <div class="center order-num">${pedido.numeroFactura ? `Factura: ${pedido.numeroFactura}` : `N&deg; ${String(pedido.id).padStart(4, "0")}`} &nbsp;&middot;&nbsp; Mesa ${pedido.mesa}</div>
  <hr class="hr">
  <div class="info">Fecha: ${fecha}</div>
  <div class="info">Mesero: ${esc((pedido as any).meseroNombre ?? "-")}</div>
  <div class="info">Cajero: ${esc((pedido as any).cobradoPorNombre ?? "-")}</div>
  <hr class="hr">
  ${itemsHtml}
  <hr class="hr">
  <div class="row"><span>Subtotal:</span><span>${formatCOP(pedido.total || 0)}</span></div>
  ${(pedido.propina || 0) > 0 ? `<div class="row"><span>Propina:</span><span>${formatCOP(pedido.propina)}</span></div>` : ""}
  <hr class="hr-solid">
  <div class="row big"><span>TOTAL:</span><span>${formatCOP(totalFinal)}</span></div>
  <hr class="hr-solid">
  ${pagosHtml}
  ${cambioVal > 0 ? `<div class="row"><span>Cambio:</span><span>${formatCOP(cambioVal)}</span></div>` : ""}
  <hr class="hr">
  <div class="footer">${cfg.mensajeFactura || "¡Gracias por su visita!"}</div>
  <div class="no-print" style="text-align:center;margin-top:16px">
    <button onclick="window.print()" style="background:#CC0000;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:900;cursor:pointer">🖨️ Imprimir Factura</button>
    <button onclick="window.close()" style="background:#555;color:#fff;border:none;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;margin-left:8px">✕ Cerrar</button>
  </div>
  <script>if(new URLSearchParams(window.location.search).get('autoprint')==='1')window.onload=()=>window.print();</script>
</body></html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    req.log.error(e, "Error al generar factura");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.patch("/pedidos/:id/items", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const parsed = modificarItemsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues }); return; }

  try {
    const usuario = (req as any).usuario;
    const [pedidoActual] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id));
    if (!pedidoActual) { res.status(404).json({ error: "Pedido no encontrado" }); return; }
    if (pedidoActual.estado === "cobrado" || pedidoActual.estado === "cancelado") {
      res.status(400).json({ error: "No se puede modificar un pedido cobrado o cancelado" });
      return;
    }

    const historialPrev = Array.isArray(pedidoActual.historialEstados) ? pedidoActual.historialEstados : [];
    const nuevoHistorial = [
      ...historialPrev,
      { estado: "modificado", usuarioId: usuario?.id, usuarioNombre: usuario?.nombre, ts: new Date().toISOString(), nota: parsed.data.nota ?? `Items actualizados · ${parsed.data.items.length} productos · Total: ${parsed.data.total.toLocaleString("es-CO")}` }
    ];

    const [pedido] = await db.update(pedidosTable).set({
      items: parsed.data.items,
      total: parsed.data.total,
      historialEstados: nuevoHistorial,
    }).where(eq(pedidosTable.id, id)).returning();

    // Imprimir comanda actualizada
    const itemsTicket = parsed.data.items.map((i: any) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio: i.precio,
      observaciones: i.observaciones,
      emoji: i.emoji,
    }));
    const comandaTicket = buildComandaTicket({
      id: pedido.id,
      mesa: pedido.mesa,
      items: itemsTicket,
      total: parsed.data.total,
      notas: pedido.notas ?? undefined,
      mesero: usuario?.nombre ?? undefined,
      fecha: new Date(pedido.creadoEn),
    });
    const comandaEscPos = buildEscPosComanda({
      id: pedido.id,
      mesa: pedido.mesa,
      items: itemsTicket,
      total: parsed.data.total,
      notas: pedido.notas ?? undefined,
      mesero: usuario?.nombre ?? undefined,
      fecha: new Date(pedido.creadoEn),
    });
    await enviarTicketImpresora(comandaTicket, "comanda", comandaEscPos);

    const result = serializePedido(pedido);
    broadcast("pedido_actualizado", result);
    broadcast("mesas_actualizadas", {});
    res.json(result);
  } catch (e) {
    req.log.error(e, "Error al modificar items del pedido");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/pedidos/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  try {
    const [pedidoActual] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id));
    if (!pedidoActual) { res.status(404).json({ error: "Pedido no encontrado" }); return; }

    const usuario = (req as any).usuario;
    const historialPrev = Array.isArray(pedidoActual.historialEstados) ? pedidoActual.historialEstados : [];
    await db.update(pedidosTable).set({
      estado: "cancelado",
      historialEstados: [...historialPrev, { estado: "cancelado", usuarioId: usuario?.id, usuarioNombre: usuario?.nombre, ts: new Date().toISOString() }]
    }).where(eq(pedidosTable.id, id));

    await db.update(mesasTable).set({ estado: "libre", personas: 0, actualizadoEn: new Date() }).where(eq(mesasTable.numero, pedidoActual.mesa));

    broadcast("pedido_eliminado", { id });
    broadcast("mesas_actualizadas", {});
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, "Error al cancelar pedido");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
