import { Router, type IRouter } from "express";
import { eq, gte, and, sql, desc, isNull } from "drizzle-orm";
import { db, cajaSesionesTable, cajaHistorialTable, pedidosTable, mesasTable, abrirCajaSchema, cerrarCajaSchema } from "@workspace/db";
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
    let totalTarjeta = 0;
    let totalTransferencia = 0;
    let totalPropinas = 0;
    let totalVentas = 0;

    for (const p of pedidosCobrados) {
      const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
      for (const pago of pagos) {
        if (pago.metodo === "efectivo") totalEfectivo += pago.monto;
        else if (pago.metodo === "tarjeta") totalTarjeta += pago.monto;
        else if (pago.metodo === "transferencia") totalTransferencia += pago.monto;
      }
      totalPropinas += p.propina ?? 0;
      totalVentas += p.total ?? 0;
    }

    const cantidadPedidos = pedidosCobrados.length;
    // Verificar mesas pendientes (cobradas o con pedidos activos)
    const [mesasPendientes] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(mesasTable)
      .where(sql`${mesasTable.estado} in ('en_pago', 'lista_cobro', 'ocupada')`);

    if ((mesasPendientes?.count ?? 0) > 0) {
      const mesasCobradas = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(mesasTable).where(sql`${mesasTable.estado} = 'en_pago'`);
      const mesasPorCobrar = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(mesasTable).where(sql`${mesasTable.estado} = 'lista_cobro'`);
      const mesasOcupadas = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(mesasTable).where(sql`${mesasTable.estado} = 'ocupada'`);
      res.status(400).json({
        error: "Hay mesas pendientes de cierre",
        detalle: `${mesasCobradas[0]?.count ?? 0} mesa(s) EN PAGO + ${mesasPorCobrar[0]?.count ?? 0} lista cobro + ${mesasOcupadas[0]?.count ?? 0} ocupada(s). Ciérralas antes de cerrar caja.`,
        mesasEnPago: mesasCobradas[0]?.count ?? 0,
        mesasListaCobro: mesasPorCobrar[0]?.count ?? 0,
        mesasAbiertas: mesasOcupadas[0]?.count ?? 0,
      });
      return;
    }

    // Efectivo esperado = fondo inicial + ventas efectivo + propinas (siempre en efectivo)
    const efectivoEsperado = sesion.montoInicial + totalEfectivo + totalPropinas;
    const diferencia = parsed.data.efectivoContado - efectivoEsperado;
    const cierreEn = new Date();

    const [sesionCerrada] = await db.update(cajaSesionesTable).set({
      cierreEn,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalPropinas,
      totalVentas,
      cantidadPedidos,
      diferencia,
      estado: "cerrada",
      notas: parsed.data.notas ?? sesion.notas,
    }).where(eq(cajaSesionesTable.id, sesion.id)).returning();

    // Guardar en historial persistente al cerrar
    await db.insert(cajaHistorialTable).values({
      fecha: cierreEn,
      usuarioId: sesion.usuarioId,
      usuarioNombre: sesion.usuarioNombre,
      montoInicial: sesion.montoInicial,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalPropinas,
      totalVentas,
      cantidadPedidos,
      diferencia,
      notas: parsed.data.notas ?? sesion.notas ?? `Cierre de caja · ${cantidadPedidos} pedidos cobrados`,
      tipo: "cierre",
    }).catch(() => {});

    res.json({
      ...sesionCerrada,
      pedidosCobrados: cantidadPedidos,
      totalVentas,
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
    let totalTarjeta = 0;
    let totalTransferencia = 0;
    let totalPropinas = 0;
    let totalVentas = 0;

    for (const p of pedidosCobrados) {
      const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
      for (const pago of pagos) {
        if (pago.metodo === "efectivo") totalEfectivo += pago.monto;
        else if (pago.metodo === "tarjeta") totalTarjeta += pago.monto;
        else if (pago.metodo === "transferencia") totalTransferencia += pago.monto;
      }
      totalPropinas += p.propina ?? 0;
      totalVentas += p.total ?? 0;
    }

    const [mesasCobradas] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(mesasTable).where(sql`${mesasTable.estado} in ('lista_cobro', 'en_pago')`);
    const [mesasAbiertas] = await db.select({ count: sql<number>`cast(count(*) as int)` }).from(mesasTable).where(sql`${mesasTable.estado} = 'ocupada'`);

    res.json({
      totalVentas,
      totalEfectivo,
      totalTarjeta,
      totalTransferencia,
      totalPropinas,
      pedidosCobrados: pedidosCobrados.length,
      total: totalEfectivo + totalTarjeta + totalTransferencia,
      mesasCobradas: mesasCobradas?.count ?? 0,
      mesasAbiertas: mesasAbiertas?.count ?? 0,
    });
  } catch (e) {
    req.log.error(e, "Error en resumen del día");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/caja/pedidos-dia", requireAuth, requireRol("admin", "caja"), async (req, res) => {
  try {
    const [sesion] = await db
      .select()
      .from(cajaSesionesTable)
      .where(eq(cajaSesionesTable.estado, "abierta"))
      .orderBy(desc(cajaSesionesTable.aperturaEn))
      .limit(1);

    const desde = sesion ? sesion.aperturaEn : inicioDelDia();

    const pedidos = await db
      .select()
      .from(pedidosTable)
      .where(and(
        eq(pedidosTable.estado, "cobrado"),
        gte(pedidosTable.cobradoEn!, desde),
      ))
      .orderBy(desc(pedidosTable.cobradoEn));

    res.json(pedidos);
  } catch (e) {
    req.log.error(e, "Error al obtener pedidos del día");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
