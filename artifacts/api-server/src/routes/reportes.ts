import { Router, type IRouter } from "express";
import { eq, gte, lte, and, sql, desc } from "drizzle-orm";
import { db, pedidosTable, mesasTable, usuariosTable, configuracionTable } from "@workspace/db";
import { requireAuth, requireRol } from "../middlewares/auth";

async function obtenerConfig() {
  const filas = await db.select().from(configuracionTable).limit(1);
  if (filas.length > 0) return filas[0]!;
  return {
    nombreNegocio: "TIAMO BURGER",
    slogan: "La hamburguesa que te enamora",
    ruc: "",
    direccion: "",
    telefono: "",
    email: "",
    instagram: "",
    moneda: "COP",
    mensajeFactura: "¡Gracias por tu visita!",
    logoUrl: null as string | null,
  };
}

const router: IRouter = Router();

function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

router.get("/reportes/resumen", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = inicioDelDia(hoy);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - 6);
    inicioSemana.setHours(0, 0, 0, 0);

    const semanaAnteriorInicio = new Date(hoy);
    semanaAnteriorInicio.setDate(hoy.getDate() - 13);
    semanaAnteriorInicio.setHours(0, 0, 0, 0);
    const semanaAnteriorFin = new Date(hoy);
    semanaAnteriorFin.setDate(hoy.getDate() - 7);
    semanaAnteriorFin.setHours(23, 59, 59, 999);

    const [hoyStats, semanaStats, semanaAnteriorStats, mesasOcupadas] = await Promise.all([
      db.select({
        count: sql<number>`cast(count(*) as int)`,
        total: sql<number>`cast(coalesce(sum(total), 0) as int)`,
      }).from(pedidosTable).where(gte(pedidosTable.creadoEn, inicioHoy)),

      db.select({
        count: sql<number>`cast(count(*) as int)`,
        total: sql<number>`cast(coalesce(sum(total), 0) as int)`,
      }).from(pedidosTable).where(gte(pedidosTable.creadoEn, inicioSemana)),

      db.select({
        total: sql<number>`cast(coalesce(sum(total), 0) as int)`,
      }).from(pedidosTable).where(and(
        gte(pedidosTable.creadoEn, semanaAnteriorInicio),
        lte(pedidosTable.creadoEn, semanaAnteriorFin),
      )),

      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(mesasTable)
        .where(sql`${mesasTable.estado} != 'libre'`),
    ]);

    const ventasHoy = hoyStats[0]?.total ?? 0;
    const pedidosHoy = hoyStats[0]?.count ?? 0;
    const ventasSemana = semanaStats[0]?.total ?? 0;
    const pedidosSemana = semanaStats[0]?.count ?? 0;
    const ventasSemanaAnterior = semanaAnteriorStats[0]?.total ?? 1;
    const crecimiento = ventasSemanaAnterior > 0
      ? ((ventasSemana - ventasSemanaAnterior) / ventasSemanaAnterior) * 100
      : 0;

    const pedidosCobradosHoy = await db.select().from(pedidosTable).where(
      and(eq(pedidosTable.estado, "cobrado"), gte(pedidosTable.creadoEn, inicioHoy))
    );

    let efectivoHoy = 0;
    let transferenciaHoy = 0;
    let propinasHoy = 0;
    for (const p of pedidosCobradosHoy) {
      const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
      for (const pg of pagos) {
        if (pg.metodo === "efectivo") efectivoHoy += pg.monto;
        else if (pg.metodo === "transferencia") transferenciaHoy += pg.monto;
      }
      propinasHoy += p.propina ?? 0;
    }

    res.json({
      ventasHoy,
      pedidosHoy,
      mesasOcupadas: mesasOcupadas[0]?.count ?? 0,
      promedioTicket: pedidosHoy > 0 ? Math.round(ventasHoy / pedidosHoy) : 0,
      ventasSemana,
      pedidosSemana,
      crecimientoSemana: Math.round(crecimiento * 10) / 10,
      tiempoPromedioMin: 12,
      efectivoHoy,
      transferenciaHoy,
      propinasHoy,
    });
  } catch (e) {
    req.log.error(e, "Error en resumen general");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/reportes/ventas-diarias", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const inicio = inicioDelDia(fecha);
      const fin = finDelDia(fecha);

      const pedidosDia = await db.select().from(pedidosTable).where(
        and(gte(pedidosTable.creadoEn, inicio), lte(pedidosTable.creadoEn, fin))
      );

      let ventas = 0;
      let efectivo = 0;
      let transferencia = 0;
      for (const p of pedidosDia) {
        ventas += p.total;
        const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
        for (const pg of pagos) {
          if (pg.metodo === "efectivo") efectivo += pg.monto;
          else if (pg.metodo === "transferencia") transferencia += pg.monto;
        }
      }

      const fechaStr = inicio.toLocaleDateString("es-CO", { weekday: "short", day: "numeric" });
      dias.push({ fecha: fechaStr, ventas, pedidos: pedidosDia.length, efectivo, transferencia });
    }
    res.json(dias);
  } catch (e) {
    req.log.error(e, "Error en ventas diarias");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/reportes/productos-top", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = inicioDelDia(hoy);

    const pedidosHoy = await db.select({ items: pedidosTable.items })
      .from(pedidosTable).where(gte(pedidosTable.creadoEn, inicioHoy));

    const conteo = new Map<string, { nombre: string; emoji: string; cantidad: number; total: number }>();

    for (const { items } of pedidosHoy) {
      const lista = items as Array<{ id: string; nombre: string; emoji: string; precio: number; cantidad: number }>;
      for (const item of lista) {
        const prev = conteo.get(item.id) ?? { nombre: item.nombre, emoji: item.emoji, cantidad: 0, total: 0 };
        conteo.set(item.id, {
          nombre: item.nombre,
          emoji: item.emoji,
          cantidad: prev.cantidad + item.cantidad,
          total: prev.total + item.precio * item.cantidad,
        });
      }
    }

    const top = [...conteo.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 8);
    res.json(top);
  } catch (e) {
    req.log.error(e, "Error en productos top");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/reportes/ventas-por-mesero", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = inicioDelDia(hoy);

    const pedidosHoy = await db.select().from(pedidosTable).where(gte(pedidosTable.creadoEn, inicioHoy));
    const usuarios = await db.select({ id: usuariosTable.id, nombre: usuariosTable.nombre }).from(usuariosTable);
    const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u.nombre]));

    const porMesero = new Map<number, { nombre: string; pedidos: number; ventas: number; propinas: number }>();

    for (const p of pedidosHoy) {
      const uid = p.meseroId ?? 0;
      const nombre = uid > 0 ? (mapaUsuarios.get(uid) ?? "Sin asignar") : "Sin asignar";
      const prev = porMesero.get(uid) ?? { nombre, pedidos: 0, ventas: 0, propinas: 0 };
      porMesero.set(uid, {
        nombre,
        pedidos: prev.pedidos + 1,
        ventas: prev.ventas + p.total,
        propinas: prev.propinas + (p.propina ?? 0),
      });
    }

    const resultado = [...porMesero.values()].sort((a, b) => b.ventas - a.ventas);
    res.json(resultado);
  } catch (e) {
    req.log.error(e, "Error en ventas por mesero");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/reportes/pdf-dia", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = inicioDelDia(hoy);
    const finHoy = finDelDia(hoy);
    const fechaStr = hoy.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

    const [pedidosDia, allMeseros] = await Promise.all([
      db.select().from(pedidosTable).where(and(gte(pedidosTable.creadoEn, inicioHoy), lte(pedidosTable.creadoEn, finHoy))).orderBy(desc(pedidosTable.creadoEn)),
      db.select().from(usuariosTable),
    ]);

    const cobrados = pedidosDia.filter((p) => p.estado === "cobrado");
    const totalVentas = cobrados.reduce((s, p) => s + (p.total || 0), 0);
    const totalPropinas = cobrados.reduce((s, p) => s + (p.propina || 0), 0);
    const totalEfectivo = cobrados.filter((p) => p.metodoPago === "efectivo" || p.metodoPago === "mixto").reduce((s, p) => {
      const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
      return s + pagos.filter((pa: any) => pa.metodo === "efectivo").reduce((a: number, pa: any) => a + pa.monto, 0);
    }, 0);
    const totalTransferencia = cobrados.filter((p) => p.metodoPago === "transferencia" || p.metodoPago === "mixto").reduce((s, p) => {
      const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
      return s + pagos.filter((pa: any) => pa.metodo === "transferencia").reduce((a: number, pa: any) => a + pa.monto, 0);
    }, 0);

    const meseroMap = new Map<number, { nombre: string; pedidos: number; ventas: number }>();
    for (const p of cobrados) {
      if (!p.meseroId) continue;
      const entry = meseroMap.get(p.meseroId) ?? { nombre: allMeseros.find((u) => u.id === p.meseroId)?.nombre ?? `ID ${p.meseroId}`, pedidos: 0, ventas: 0 };
      entry.pedidos++;
      entry.ventas += p.total || 0;
      meseroMap.set(p.meseroId, entry);
    }
    const meseroRows = [...meseroMap.values()].sort((a, b) => b.ventas - a.ventas);

    const productosMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
    for (const p of cobrados) {
      const items = Array.isArray(p.items) ? (p.items as any[]) : [];
      for (const item of items) {
        const k = item.nombre;
        const e = productosMap.get(k) ?? { nombre: k, cantidad: 0, total: 0 };
        e.cantidad += item.cantidad;
        e.total += item.precio * item.cantidad;
        productosMap.set(k, e);
      }
    }
    const topProductos = [...productosMap.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);

    const pedidosRows = cobrados.slice(0, 30).map((p) => {
      const hora = new Date(p.creadoEn).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      return `<tr><td>#${String(p.id).padStart(4, "0")}</td><td>${p.mesa}</td><td>${hora}</td><td>${p.metodoPago ?? "—"}</td><td style="text-align:right;font-weight:700;">${formatCOP(p.total)}</td>${p.propina > 0 ? `<td style="text-align:right;color:#7c3aed;">${formatCOP(p.propina)}</td>` : "<td>—</td>"}</tr>`;
    }).join("");

    const meseroRowsHtml = meseroRows.map((m) => `<tr><td>${m.nombre}</td><td style="text-align:center;">${m.pedidos}</td><td style="text-align:right;font-weight:700;">${formatCOP(m.ventas)}</td></tr>`).join("");
    const productosRowsHtml = topProductos.map((p, i) => `<tr><td style="text-align:center;">${i + 1}</td><td>${p.nombre}</td><td style="text-align:center;">${p.cantidad}</td><td style="text-align:right;font-weight:700;">${formatCOP(p.total)}</td></tr>`).join("");

    const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Reporte del Día — TIAMO BURGER</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;background:#fff;padding:24px;max-width:900px;margin:0 auto;font-size:13px}
.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #CC0000;margin-bottom:24px}
.brand{font-size:28px;font-weight:900;color:#CC0000;letter-spacing:-1px}
.date{font-size:12px;color:#555;text-align:right;line-height:1.8}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.kpi{background:#f9f9f9;border-radius:12px;padding:14px;border:1px solid #eee}
.kpi-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888;margin-bottom:6px}
.kpi-value{font-size:20px;font-weight:900;color:#CC0000}
.kpi-sub{font-size:10px;color:#aaa;margin-top:2px}
.payment-row{display:flex;gap:12px;margin-bottom:24px}
.payment-card{flex:1;background:#f9f9f9;border-radius:12px;padding:14px;border:1px solid #eee}
.payment-card.green .kpi-value{color:#16a34a}
.payment-card.blue .kpi-value{color:#2563eb}
.payment-card.purple .kpi-value{color:#7c3aed}
h2{font-size:14px;font-weight:800;margin-bottom:12px;color:#1a1a1a;text-transform:uppercase;letter-spacing:.5px;border-left:3px solid #CC0000;padding-left:8px}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px}
thead th{background:#CC0000;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:8px 10px;text-align:left}
tbody tr:nth-child(even){background:#f9f9f9}tbody tr td{padding:7px 10px;border-bottom:1px solid #eee}
.footer{text-align:center;margin-top:32px;padding-top:16px;border-top:2px dashed #ddd;font-size:11px;color:#aaa}
.print-btn{display:block;margin:20px auto;padding:12px 32px;background:#CC0000;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
@media print{.print-btn{display:none}@page{margin:15mm}}
</style></head><body>
<div class="header">
  <div><div class="brand">🍔 TIAMO BURGER</div><div style="font-size:11px;color:#888;margin-top:2px">Sistema POS — Reporte de Cierre de Día</div></div>
  <div class="date"><strong style="font-size:15px;color:#1a1a1a;text-transform:capitalize;">${fechaStr}</strong><br>Generado: ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</div>
</div>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Ventas Totales</div><div class="kpi-value">${formatCOP(totalVentas)}</div><div class="kpi-sub">${cobrados.length} pedidos cobrados</div></div>
  <div class="kpi"><div class="kpi-label">Pedidos del Día</div><div class="kpi-value">${pedidosDia.length}</div><div class="kpi-sub">${cobrados.length} cobrados · ${pedidosDia.filter((p) => p.estado === "cancelado").length} cancelados</div></div>
  <div class="kpi"><div class="kpi-label">Propinas</div><div class="kpi-value">${formatCOP(totalPropinas)}</div><div class="kpi-sub">ingresos adicionales</div></div>
  <div class="kpi"><div class="kpi-label">Ticket Promedio</div><div class="kpi-value">${cobrados.length > 0 ? formatCOP(Math.round(totalVentas / cobrados.length)) : formatCOP(0)}</div><div class="kpi-sub">por pedido</div></div>
</div>
<div class="payment-row">
  <div class="payment-card green"><div class="kpi-label">💵 Efectivo</div><div class="kpi-value">${formatCOP(totalEfectivo)}</div></div>
  <div class="payment-card blue"><div class="kpi-label">💳 Transferencia</div><div class="kpi-value">${formatCOP(totalTransferencia)}</div></div>
  <div class="payment-card purple"><div class="kpi-label">⭐ Propinas</div><div class="kpi-value">${formatCOP(totalPropinas)}</div></div>
</div>
${meseroRows.length > 0 ? `<h2>Ventas por Mesero</h2><table><thead><tr><th>Mesero</th><th style="text-align:center">Pedidos</th><th style="text-align:right">Ventas</th></tr></thead><tbody>${meseroRowsHtml}</tbody></table>` : ""}
${topProductos.length > 0 ? `<h2>Top 10 Productos Más Vendidos</h2><table><thead><tr><th style="text-align:center">#</th><th>Producto</th><th style="text-align:center">Cantidad</th><th style="text-align:right">Total</th></tr></thead><tbody>${productosRowsHtml}</tbody></table>` : ""}
<h2>Detalle de Pedidos Cobrados</h2>
<table><thead><tr><th>ID</th><th>Mesa</th><th>Hora</th><th>Método</th><th style="text-align:right">Total</th><th style="text-align:right">Propina</th></tr></thead><tbody>${pedidosRows || `<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa;">Sin pedidos cobrados hoy</td></tr>`}</tbody></table>
<div class="footer"><p>Este reporte es de uso exclusivo del negocio · TIAMO BURGER POS © ${new Date().getFullYear()}</p></div>
<button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
<script>if(new URLSearchParams(window.location.search).get('autoprint')==='1')window.onload=()=>window.print();</script>
</body></html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    req.log.error(e, "Error al generar PDF del día");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/reportes/mesas-stats", requireAuth, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = inicioDelDia(hoy);

    const [pedidosHoyCount, porMesa] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as int)` })
        .from(pedidosTable).where(gte(pedidosTable.creadoEn, inicioHoy)),
      db.select({ mesa: pedidosTable.mesa, count: sql<number>`cast(count(*) as int)` })
        .from(pedidosTable).where(gte(pedidosTable.creadoEn, inicioHoy))
        .groupBy(pedidosTable.mesa).orderBy(sql`count(*) desc`),
    ]);

    res.json({
      totalRotaciones: pedidosHoyCount[0]?.count ?? 0,
      mesaMasActiva: porMesa[0]?.mesa ?? "—",
      tiempoPromedioMesa: 35,
    });
  } catch (e) {
    req.log.error(e, "Error en mesas stats");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ===== Reporte semanal / mensual PDF =====
async function generarReportePeriodoHTML(opts: {
  desde: Date;
  hasta: Date;
  titulo: string;
}) {
  const { desde, hasta, titulo } = opts;
  const cfg = await obtenerConfig();
  const formatCOP = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: cfg.moneda || "COP", minimumFractionDigits: 0 }).format(n);

  const [pedidosPeriodo, allMeseros] = await Promise.all([
    db.select().from(pedidosTable).where(and(gte(pedidosTable.creadoEn, desde), lte(pedidosTable.creadoEn, hasta))).orderBy(desc(pedidosTable.creadoEn)),
    db.select().from(usuariosTable),
  ]);

  const cobrados = pedidosPeriodo.filter((p) => p.estado === "cobrado");
  const totalVentas = cobrados.reduce((s, p) => s + (p.total || 0), 0);
  const totalPropinas = cobrados.reduce((s, p) => s + (p.propina || 0), 0);
  let totalEfectivo = 0;
  let totalTransferencia = 0;
  for (const p of cobrados) {
    const pagos = Array.isArray(p.pagos) ? (p.pagos as any[]) : [];
    for (const pa of pagos) {
      if (pa.metodo === "efectivo") totalEfectivo += pa.monto;
      else if (pa.metodo === "transferencia") totalTransferencia += pa.monto;
    }
  }

  // Agrupar por día
  const porDia = new Map<string, { fecha: string; ventas: number; pedidos: number }>();
  for (const p of cobrados) {
    const f = new Date(p.creadoEn);
    const key = f.toISOString().slice(0, 10);
    const label = f.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
    const e = porDia.get(key) ?? { fecha: label, ventas: 0, pedidos: 0 };
    e.ventas += p.total || 0;
    e.pedidos++;
    porDia.set(key, e);
  }
  const diasArr = [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  const maxVentaDia = Math.max(...diasArr.map((d) => d.ventas), 1);

  // Top productos
  const productosMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
  for (const p of cobrados) {
    const items = Array.isArray(p.items) ? (p.items as any[]) : [];
    for (const item of items) {
      const e = productosMap.get(item.nombre) ?? { nombre: item.nombre, cantidad: 0, total: 0 };
      e.cantidad += item.cantidad;
      e.total += item.precio * item.cantidad;
      productosMap.set(item.nombre, e);
    }
  }
  const topProductos = [...productosMap.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 15);

  // Por mesero
  const meseroMap = new Map<number, { nombre: string; pedidos: number; ventas: number }>();
  for (const p of cobrados) {
    if (!p.meseroId) continue;
    const e = meseroMap.get(p.meseroId) ?? { nombre: allMeseros.find((u) => u.id === p.meseroId)?.nombre ?? `ID ${p.meseroId}`, pedidos: 0, ventas: 0 };
    e.pedidos++;
    e.ventas += p.total || 0;
    meseroMap.set(p.meseroId, e);
  }
  const meseros = [...meseroMap.values()].sort((a, b) => b.ventas - a.ventas);

  const desdeStr = desde.toLocaleDateString("es-CO", { day: "numeric", month: "long" });
  const hastaStr = hasta.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

  const barrasHtml = diasArr.map((d) => {
    const h = Math.max(8, Math.round((d.ventas / maxVentaDia) * 140));
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:32px;">
      <div style="font-size:9px;font-weight:700;color:#888;">${formatCOP(d.ventas).replace(/\s/g, "")}</div>
      <div style="width:100%;height:${h}px;background:linear-gradient(180deg,#CC0000,#7a0000);border-radius:4px 4px 0 0;"></div>
      <div style="font-size:9px;color:#666;text-align:center;text-transform:capitalize;">${d.fecha}</div>
    </div>`;
  }).join("");

  const topProductosHtml = topProductos.map((p, i) => `<tr><td style="text-align:center;color:#888;">${i + 1}</td><td>${p.nombre}</td><td style="text-align:center;">${p.cantidad}</td><td style="text-align:right;font-weight:700;">${formatCOP(p.total)}</td></tr>`).join("");
  const meserosHtml = meseros.map((m) => `<tr><td>${m.nombre}</td><td style="text-align:center;">${m.pedidos}</td><td style="text-align:right;font-weight:700;">${formatCOP(m.ventas)}</td></tr>`).join("");

  const ticketProm = cobrados.length > 0 ? Math.round(totalVentas / cobrados.length) : 0;
  const diasActivos = diasArr.length || 1;
  const promDiario = Math.round(totalVentas / diasActivos);

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${titulo} — ${cfg.nombreNegocio}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;background:#fff;padding:24px;max-width:980px;margin:0 auto;font-size:13px}
.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #CC0000;margin-bottom:24px}
.brand{font-size:28px;font-weight:900;color:#CC0000;letter-spacing:-1px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.kpi{background:#f9f9f9;border-radius:12px;padding:14px;border:1px solid #eee}
.kpi-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888;margin-bottom:6px}
.kpi-value{font-size:20px;font-weight:900;color:#CC0000}
.kpi-sub{font-size:10px;color:#aaa;margin-top:2px}
h2{font-size:14px;font-weight:800;margin-bottom:12px;color:#1a1a1a;text-transform:uppercase;letter-spacing:.5px;border-left:3px solid #CC0000;padding-left:8px;margin-top:24px}
table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px}
thead th{background:#CC0000;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:8px 10px;text-align:left}
tbody tr:nth-child(even){background:#f9f9f9}tbody tr td{padding:7px 10px;border-bottom:1px solid #eee}
.chart-card{background:#fafafa;border:1px solid #eee;border-radius:12px;padding:18px;margin-bottom:24px}
.chart{display:flex;align-items:flex-end;gap:8px;height:170px;padding-top:18px}
.footer{text-align:center;margin-top:32px;padding-top:16px;border-top:2px dashed #ddd;font-size:11px;color:#aaa}
.print-btn{display:block;margin:20px auto;padding:12px 32px;background:#CC0000;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
@media print{.print-btn{display:none}@page{margin:14mm}}
</style></head><body>
<div class="header"><div><div class="brand">🍔 ${cfg.nombreNegocio}</div><div style="font-size:11px;color:#888;margin-top:2px">${titulo}</div></div>
<div style="text-align:right;font-size:12px;color:#555;line-height:1.7"><strong style="font-size:15px;color:#1a1a1a;text-transform:capitalize;">${desdeStr} — ${hastaStr}</strong><br>Generado: ${new Date().toLocaleString("es-CO")}</div></div>
<div class="kpi-grid">
<div class="kpi"><div class="kpi-label">Ventas Totales</div><div class="kpi-value">${formatCOP(totalVentas)}</div><div class="kpi-sub">${cobrados.length} pedidos cobrados</div></div>
<div class="kpi"><div class="kpi-label">Promedio Diario</div><div class="kpi-value">${formatCOP(promDiario)}</div><div class="kpi-sub">${diasActivos} días activos</div></div>
<div class="kpi"><div class="kpi-label">Ticket Promedio</div><div class="kpi-value">${formatCOP(ticketProm)}</div><div class="kpi-sub">por pedido</div></div>
<div class="kpi"><div class="kpi-label">Propinas</div><div class="kpi-value">${formatCOP(totalPropinas)}</div><div class="kpi-sub">ingresos extras</div></div>
</div>
<div style="display:flex;gap:12px;margin-bottom:24px">
<div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px"><div class="kpi-label">💵 Efectivo</div><div class="kpi-value" style="color:#16a34a">${formatCOP(totalEfectivo)}</div></div>
<div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px"><div class="kpi-label">💳 Transferencia</div><div class="kpi-value" style="color:#2563eb">${formatCOP(totalTransferencia)}</div></div>
</div>
${diasArr.length > 0 ? `<h2>Tendencia de Ventas</h2><div class="chart-card"><div class="chart">${barrasHtml}</div></div>` : ""}
${meseros.length > 0 ? `<h2>Ventas por Mesero</h2><table><thead><tr><th>Mesero</th><th style="text-align:center">Pedidos</th><th style="text-align:right">Ventas</th></tr></thead><tbody>${meserosHtml}</tbody></table>` : ""}
${topProductos.length > 0 ? `<h2>Top 15 Productos</h2><table><thead><tr><th style="text-align:center">#</th><th>Producto</th><th style="text-align:center">Cantidad</th><th style="text-align:right">Total</th></tr></thead><tbody>${topProductosHtml}</tbody></table>` : ""}
<div class="footer"><p>Reporte exclusivo del negocio · ${cfg.nombreNegocio}${cfg.ruc ? ` · NIT/RUC ${cfg.ruc}` : ""} © ${new Date().getFullYear()}</p></div>
<button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
<script>if(new URLSearchParams(window.location.search).get('autoprint')==='1')window.onload=()=>window.print();</script>
</body></html>`;
}

router.get("/reportes/pdf-semana", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const hasta = finDelDia(new Date());
    const desde = inicioDelDia(new Date());
    desde.setDate(desde.getDate() - 6);
    const html = await generarReportePeriodoHTML({ desde, hasta, titulo: "Reporte Semanal" });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    req.log.error(e, "Error pdf-semana");
    res.status(500).json({ error: "Error al generar reporte" });
  }
});

router.get("/reportes/pdf-mes", requireAuth, requireRol("admin"), async (req, res) => {
  try {
    const hasta = finDelDia(new Date());
    const desde = inicioDelDia(new Date());
    desde.setDate(desde.getDate() - 29);
    const html = await generarReportePeriodoHTML({ desde, hasta, titulo: "Reporte Mensual" });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    req.log.error(e, "Error pdf-mes");
    res.status(500).json({ error: "Error al generar reporte" });
  }
});

export default router;
