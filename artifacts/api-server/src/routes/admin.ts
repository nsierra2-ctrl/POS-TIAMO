import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { requireAuth, requireRol } from "../middlewares/auth";
import { db, mesasTable, pedidosTable, cajaSesionesTable, cajaHistorialTable, promocionesTable } from "@workspace/db";
import { z } from "zod";
import { eq, and, gte, desc } from "drizzle-orm";
import { broadcast } from "../lib/broadcast";

const router: IRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

router.post("/upload", requireAuth, requireRol("admin"), (req, res) => {
  const { imageData } = req.body as { imageData?: string };
  if (!imageData || !imageData.startsWith("data:image")) {
    res.status(400).json({ error: "Imagen inválida" });
    return;
  }
  try {
    const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/s);
    if (!match) { res.status(400).json({ error: "Formato inválido" }); return; }
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const base64 = match[2];
    const buffer = Buffer.from(base64, "base64");
    const fname = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, fname), buffer);
    res.json({ url: `/api/uploads/${fname}` });
  } catch (e) {
    req.log.error(e, "Error al guardar imagen");
    res.status(500).json({ error: "Error al guardar imagen" });
  }
});

router.post("/admin/reset", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const ahora = new Date();

    // 1. Guardar historial de caja antes de borrar
    const [sesionAbierta] = await db
      .select()
      .from(cajaSesionesTable)
      .where(eq(cajaSesionesTable.estado, "abierta"))
      .orderBy(desc(cajaSesionesTable.aperturaEn))
      .limit(1);

    if (sesionAbierta) {
      const pedidosCobrados = await db
        .select()
        .from(pedidosTable)
        .where(and(
          eq(pedidosTable.estado, "cobrado"),
          gte(pedidosTable.cobradoEn!, sesionAbierta.aperturaEn),
        ));
      let totalEfectivo = 0;
      let totalTransferencia = 0;
      let totalPropinas = 0;
      for (const p of pedidosCobrados) {
        const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
        for (const pago of pagos) {
          if (pago.metodo === "efectivo") totalEfectivo += pago.monto;
          else if (pago.metodo === "transferencia") totalTransferencia += pago.monto;
        }
        totalPropinas += p.propina ?? 0;
      }
      await db.insert(cajaHistorialTable).values({
        fecha: ahora,
        usuarioId: usuario?.id ?? 0,
        usuarioNombre: usuario?.nombre ?? "Sistema",
        montoInicial: sesionAbierta.montoInicial,
        totalEfectivo,
        totalTransferencia,
        totalPropinas,
        totalVentas: totalEfectivo + totalTransferencia,
        cantidadPedidos: pedidosCobrados.length,
        diferencia: sesionAbierta.diferencia,
        notas: `Reset de día · Sesión iniciada por ${sesionAbierta.usuarioNombre} · Pedidos cobrados: ${pedidosCobrados.length}`,
        tipo: "reset",
      });
    }

    // 2. Si hay sesiones cerradas hoy, también guardarlas en historial
    const inicioDia = new Date(); inicioDia.setHours(0, 0, 0, 0);
    const sesionesCerradasHoy = await db
      .select()
      .from(cajaSesionesTable)
      .where(and(eq(cajaSesionesTable.estado, "cerrada"), gte(cajaSesionesTable.cierreEn!, inicioDia)));
    for (const s of sesionesCerradasHoy) {
      const pedidosCobrados = await db
        .select()
        .from(pedidosTable)
        .where(and(eq(pedidosTable.estado, "cobrado"), gte(pedidosTable.cobradoEn!, s.aperturaEn)));
      let totalEfectivo = 0;
      let totalTransferencia = 0;
      let totalPropinas = 0;
      for (const p of pedidosCobrados) {
        const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
        for (const pago of pagos) {
          if (pago.metodo === "efectivo") totalEfectivo += pago.monto;
          else if (pago.metodo === "transferencia") totalTransferencia += pago.monto;
        }
        totalPropinas += p.propina ?? 0;
      }
      await db.insert(cajaHistorialTable).values({
        fecha: s.cierreEn ?? ahora,
        usuarioId: s.usuarioId,
        usuarioNombre: s.usuarioNombre,
        montoInicial: s.montoInicial,
        totalEfectivo,
        totalTransferencia,
        totalPropinas,
        totalVentas: totalEfectivo + totalTransferencia,
        cantidadPedidos: pedidosCobrados.length,
        diferencia: s.diferencia,
        notas: `Cierre de caja · Reset de día`,
        tipo: "reset",
      });
    }

    const pedidosEliminados = await db.delete(pedidosTable).returning({ id: pedidosTable.id });
    const cajaSesionesEliminadas = await db.delete(cajaSesionesTable).returning({ id: cajaSesionesTable.id });
    await db.update(mesasTable).set({ estado: "libre", personas: 0 });
    broadcast("reset_datos", { ts: new Date().toISOString() });
    res.json({
      ok: true,
      mensaje: "Datos reiniciados correctamente",
      pedidosEliminados: pedidosEliminados.length,
      cajaSesionesEliminadas: cajaSesionesEliminadas.length,
    });
  } catch (e) {
    req.log.error(e, "Error al resetear datos");
    res.status(500).json({ error: "Error al reiniciar datos" });
  }
});

router.get("/admin/historial-caja", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const rows = await db.select().from(cajaHistorialTable).orderBy(desc(cajaHistorialTable.fecha)).limit(100);
    res.json(rows.map((r) => ({ ...r, fecha: r.fecha.toISOString() })));
  } catch (e) {
    req.log.error(e, "Error al obtener historial de caja");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

const promocionSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum(["descuento", "combo", "2x1", "happy_hour"]).default("descuento"),
  descuento: z.number().int().min(0).optional(),
  tipoDescuento: z.enum(["porcentaje", "fijo"]).default("porcentaje"),
  activo: z.boolean().default(true),
  diasSemana: z.string().optional(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  imagenUrl: z.string().optional(),
});

router.get("/promociones", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(promocionesTable).orderBy(promocionesTable.id);
    res.json(rows.map((r) => ({ ...r, creadoEn: r.creadoEn.toISOString() })));
  } catch (e) {
    req.log.error(e, "Error al obtener promociones");
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/promociones", requireAuth, requireRol("admin"), async (req, res) => {
  const parsed = promocionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message }); return; }
  try {
    const [row] = await db.insert(promocionesTable).values(parsed.data).returning();
    res.status(201).json({ ...row, creadoEn: row.creadoEn.toISOString() });
  } catch (e) {
    req.log.error(e, "Error al crear promoción");
    res.status(500).json({ error: "Error interno" });
  }
});

router.put("/promociones/:id", requireAuth, requireRol("admin"), async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const parsed = promocionSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message }); return; }
  try {
    const [row] = await db.update(promocionesTable).set(parsed.data).where(eq(promocionesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "No encontrada" }); return; }
    res.json({ ...row, creadoEn: row.creadoEn.toISOString() });
  } catch (e) {
    req.log.error(e, "Error al actualizar promoción");
    res.status(500).json({ error: "Error interno" });
  }
});

router.delete("/promociones/:id", requireAuth, requireRol("admin"), async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [row] = await db.delete(promocionesTable).where(eq(promocionesTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "No encontrada" }); return; }
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, "Error al eliminar promoción");
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
