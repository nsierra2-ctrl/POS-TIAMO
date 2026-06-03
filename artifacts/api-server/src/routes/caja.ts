import { Router, type IRouter } from "express";
import { eq, gte, and, sql, desc, isNull } from "drizzle-orm";
import { db, cajaSesionesTable, pedidosTable, abrirCajaSchema, cerrarCajaSchema } from "@workspace/db";
import { requireAuth, requireRol } from "../middlewares/auth";

const router: IRouter = Router();

function inicioDelDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/caja/sesion-activa", requireAuth, async (req, res) => {
  try {
    const [sesion] = await db
      .select()
      .from(cajaSesionesTable)
      .where(eq(cajaSesionesTable.estado, "abierta"))
      .orderBy(desc(cajaSesionesTable.aperturaEn))
      .limit(1);
    res.json(sesion ?? null);
  } catch (e) {
    req.log.error(e, "Error al obtener sesión de caja");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/caja/abrir", requireAuth, requireRol("admin", "caja"), async (req, res) => {
  const parsed = abrirCajaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
    return;
  }
  try {
    const sesionAbierta = await db
      .select({ id: cajaSesionesTable.id })
      .from(cajaSesionesTable)
      .where(eq(cajaSesionesTable.estado, "abierta"))
      .limit(1);

    if (sesionAbierta.length > 0) {
      res.status(400).json({ error: "Ya hay una caja abierta" });
      return;
    }

    const usuario = (req as any).usuario;
    const [sesion] = await db.insert(cajaSesionesTable).values({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      montoInicial: parsed.data.montoInicial,
      notas: parsed.data.notas ?? null,
    }).returning();

    res.status(201).json(sesion);
  } catch (e) {
    req.log.error(e, "Error al abrir caja");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/caja/cerrar", requireAuth, requireRol("admin", "caja"), async (req, res) => {
  const parsed = cerrarCajaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }

  try {
    const [sesion] = await db
      .select()
      .from(cajaSesionesTable)
      .where(eq(cajaSesionesTable.estado, "abierta"))
      .orderBy(desc(cajaSesionesTable.aperturaEn))
      .limit(1);

    if (!sesion) {
      res.status(404).json({ error: "No hay caja abierta" });
      return;
    }

    const pedidosCobrados = await db
      .select()
      .from(pedidosTable)
      .where(and(
        eq(pedidosTable.estado, "cobrado"),
        gte(pedidosTable.cobradoEn!, sesion.aperturaEn),
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

    const efectivoEsperado = totalEfectivo + sesion.montoInicial;
    const diferencia = parsed.data.efectivoContado - efectivoEsperado;

    const [sesionCerrada] = await db.update(cajaSesionesTable).set({
      cierreEn: new Date(),
      totalEfectivo,
      totalTransferencia,
      totalPropinas,
      diferencia,
      estado: "cerrada",
      notas: parsed.data.notas ?? sesion.notas,
    }).where(eq(cajaSesionesTable.id, sesion.id)).returning();

    res.json({
      ...sesionCerrada,
      pedidosCobrados: pedidosCobrados.length,
      efectivoEsperado,
      efectivoContado: parsed.data.efectivoContado,
    });
  } catch (e) {
    req.log.error(e, "Error al cerrar caja");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/caja/sesiones", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const sesiones = await db
      .select()
      .from(cajaSesionesTable)
      .orderBy(desc(cajaSesionesTable.aperturaEn))
      .limit(30);
    res.json(sesiones);
  } catch (e) {
    req.log.error(e, "Error al obtener sesiones de caja");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/caja/resumen-dia", requireAuth, requireRol("admin", "caja"), async (req, res) => {
  try {
    const inicio = inicioDelDia();
    const pedidosCobrados = await db
      .select()
      .from(pedidosTable)
      .where(and(
        eq(pedidosTable.estado, "cobrado"),
        gte(pedidosTable.cobradoEn!, inicio),
      ));

    let totalEfectivo = 0;
    let totalTransferencia = 0;
    let totalPropinas = 0;
    let totalVentas = 0;

    for (const p of pedidosCobrados) {
      const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
      for (const pago of pagos) {
        if (pago.metodo === "efectivo") totalEfectivo += pago.monto;
        else if (pago.metodo === "transferencia") totalTransferencia += pago.monto;
      }
      totalPropinas += p.propina ?? 0;
      totalVentas += p.total ?? 0;
    }

    res.json({
      totalVentas,
      totalEfectivo,
      totalTransferencia,
      totalPropinas,
      pedidosCobrados: pedidosCobrados.length,
      total: totalEfectivo + totalTransferencia,
    });
  } catch (e) {
    req.log.error(e, "Error en resumen del día");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
