import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import {
  useGetResumenGeneral,
  useGetVentasDiarias,
  useGetProductosTop,
  useGetVentasPorMesero,
  getGetResumenGeneralQueryKey,
  getGetVentasDiariasQueryKey,
  getGetProductosTopQueryKey,
  getGetVentasPorMeseroQueryKey,
} from "@workspace/api-client-react";
import { useSSE } from "@/hooks/use-sse";
import { formatPrice } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ShoppingBag, ChefHat, FileText, Users, Banknote, CreditCard, Wallet, Star, Download, Package } from "lucide-react";

function KpiCard({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub?: string; color: string; icon?: any }) {
  return (
    <div className="rounded-2xl border border-white/5 p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-zinc-700" />}
      </div>
      <div className="text-3xl font-black font-mono leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-zinc-600 mt-2">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: resumen, isLoading: isResumenLoading } = useGetResumenGeneral({
    query: { queryKey: getGetResumenGeneralQueryKey(), refetchInterval: 30000 },
  });
  const { data: ventas, isLoading: isVentasLoading } = useGetVentasDiarias({
    query: { queryKey: getGetVentasDiariasQueryKey() },
  });
  const { data: productos } = useGetProductosTop({
    query: { queryKey: getGetProductosTopQueryKey(), refetchInterval: 60000 },
  });
  const { data: porMesero } = useGetVentasPorMesero({
    query: { queryKey: getGetVentasPorMeseroQueryKey(), refetchInterval: 30000 },
  });

  const [pedidosDia, setPedidosDia] = useState<any[]>([]);

  const fetchPedidosDia = useCallback(async () => {
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const r = await fetch(`${base}/api/caja/pedidos-dia`, { credentials: "include" });
      if (r.ok) setPedidosDia(await r.json());
    } catch {}
  }, []);

  useSSE(fetchPedidosDia);

  useEffect(() => {
    fetchPedidosDia();
    const t = setInterval(fetchPedidosDia, 15000);
    return () => clearInterval(t);
  }, [fetchPedidosDia]);

  const allProductos = pedidosDia.flatMap((p) => {
    const hora = new Date(p.cobradoEn || p.creadoEn).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    const items: any[] = Array.isArray(p.items) ? p.items : [];
    return items.map((it) => ({
      mesa: p.mesa as string,
      hora,
      nombre: (it.nombre ?? "") as string,
      emoji: (it.emoji ?? "") as string,
      cantidad: (it.cantidad ?? 1) as number,
      precio: (it.precio ?? 0) as number,
      subtotal: ((it.precio ?? 0) * (it.cantidad ?? 1)) as number,
      pedidoId: p.id as number,
    }));
  });
  const totalProductos = allProductos.reduce((s, i) => s + i.subtotal, 0);

  const pieData = [
    { name: "Efectivo", value: resumen?.efectivoHoy ?? 0, color: "#22c55e" },
    { name: "Tarjeta", value: resumen?.tarjetaHoy ?? 0, color: "#8b5cf6" },
    { name: "Transferencia", value: resumen?.transferenciaHoy ?? 0, color: "#3b82f6" },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20 md:pb-0">
      <Navigation />

      <main className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white font-display tracking-tight">Centro de Mando</h1>
            <p className="text-zinc-500 text-sm">Métricas en tiempo real · TIAMO BURGER</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => window.open("/api/reportes/pdf-dia", "_blank")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/8 transition-colors text-sm font-semibold">
              <Download size={14} /> PDF Día
            </button>
            <button onClick={() => window.open("/api/reportes/pdf-semana", "_blank")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/8 transition-colors text-sm font-semibold">
              <Download size={14} /> PDF Semana
            </button>
            <button onClick={() => window.open("/api/reportes/pdf-mes", "_blank")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/8 transition-colors text-sm font-semibold">
              <Download size={14} /> PDF Mes
            </button>
            <button onClick={() => window.location.href = "/cocina"} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/8 transition-colors text-sm font-semibold">
              <ChefHat size={14} /> Cocina
            </button>
            <button onClick={() => window.location.href = "/caja"} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-white" style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)" }}>
              <Banknote size={14} /> Caja
            </button>
          </div>
        </div>

        {/* KPIs Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard icon={TrendingUp} label="Ventas Hoy" value={isResumenLoading ? "..." : formatPrice(resumen?.ventasHoy || 0)} sub="total del día" color="#FF2D2D" />
          <KpiCard icon={ShoppingBag} label="Pedidos Hoy" value={isResumenLoading ? "..." : String(resumen?.pedidosHoy || 0)} sub="órdenes registradas" color="#f59e0b" />
          <KpiCard icon={Users} label="Mesas Ocupadas" value={isResumenLoading ? "..." : String(resumen?.mesasOcupadas || 0)} sub="activas ahora" color="#3b82f6" />
          <KpiCard icon={Star} label="Ticket Promedio" value={isResumenLoading ? "..." : formatPrice(resumen?.promedioTicket || 0)} sub="por orden" color="#22c55e" />
        </div>

        {/* KPIs Row 2 — payment breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Banknote} label="Efectivo Hoy" value={isResumenLoading ? "..." : formatPrice(resumen?.efectivoHoy || 0)} color="#22c55e" />
          <KpiCard icon={CreditCard} label="Tarjeta Hoy" value={isResumenLoading ? "..." : formatPrice(resumen?.tarjetaHoy || 0)} color="#8b5cf6" />
          <KpiCard icon={Wallet} label="Transferencia Hoy" value={isResumenLoading ? "..." : formatPrice(resumen?.transferenciaHoy || 0)} color="#3b82f6" />
          <KpiCard icon={Star} label="Propinas Hoy" value={isResumenLoading ? "..." : formatPrice(resumen?.propinasHoy || 0)} color="#a855f7" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-red-500" />
              <h3 className="font-bold text-sm text-white">Ventas — Últimos 7 Días</h3>
            </div>
            {isVentasLoading ? (
              <div className="h-52 animate-pulse rounded-xl bg-white/5" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ventas ?? []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="fecha" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11 }}
                    labelStyle={{ color: "#a1a1aa", marginBottom: 4 }}
                    formatter={(val: any, name: string) => [formatPrice(val), name === "ventas" ? "Total" : name === "efectivo" ? "Efectivo" : name === "tarjeta" ? "Tarjeta" : "Transferencia"]}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="ventas" name="ventas" fill="#FF2D2D" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="efectivo" name="efectivo" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="tarjeta" name="tarjeta" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="transferencia" name="transferencia" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Pie */}
          <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Banknote size={16} className="text-emerald-500" />
              <h3 className="font-bold text-sm text-white">Pagos del Día</h3>
            </div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {pieData.map((d) => {
                    const total = pieData.reduce((s, p) => s + p.value, 0);
                    const pct = total > 0 ? Math.round(d.value / total * 100) : 0;
                    return (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-zinc-400 font-medium">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs" style={{ color: d.color }}>{formatPrice(d.value)}</span>
                          <span className="text-[10px] text-zinc-600">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-700">
                <Banknote className="w-10 h-10 mb-2 opacity-20" />
                <span className="text-xs">Sin cobros registrados hoy</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Products */}
          <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={16} className="text-amber-500" />
              <h3 className="font-bold text-sm text-white">Productos más Vendidos</h3>
            </div>
            <div className="space-y-2.5">
              {(productos ?? []).slice(0, 5).map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0"
                    style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#a1a1aa" : i === 2 ? "#cd7c2f" : "#3f3f46" }}>
                    {i + 1}
                  </div>
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.nombre}</p>
                    <p className="text-[10px] text-zinc-600">{p.cantidad} vendidos</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400">{formatPrice(p.total)}</span>
                </div>
              ))}
              {!productos?.length && <p className="text-zinc-700 text-xs text-center py-6">Sin datos aún</p>}
            </div>
          </div>

          {/* Ventas por mesero */}
          <div className="lg:col-span-2 rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-blue-500" />
              <h3 className="font-bold text-sm text-white">Ventas por Mesero — Hoy</h3>
            </div>
            <div className="space-y-3">
              {(porMesero ?? []).map((m: any, i: number) => {
                const maxVentas = (porMesero ?? []).reduce((mx: number, x: any) => Math.max(mx, x.ventas), 1);
                const pct = Math.round(m.ventas / maxVentas * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-[10px] font-black text-zinc-400">
                          {m.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{m.nombre}</span>
                        <span className="text-[10px] text-zinc-600">{m.pedidos} pedidos</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {m.propinas > 0 && <span className="text-[10px] text-purple-400 font-semibold">+{formatPrice(m.propinas)} propina</span>}
                        <span className="font-mono font-bold text-red-400">{formatPrice(m.ventas)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!porMesero?.length && <p className="text-zinc-700 text-xs text-center py-6">Sin datos de meseros aún</p>}
            </div>
          </div>
        </div>

        {/* Productos Vendidos Hoy */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-amber-500" />
              <h3 className="font-bold text-sm text-white">Productos Vendidos Hoy</h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">LIVE</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-600 text-xs">{allProductos.length} items · {formatPrice(totalProductos)}</span>
              <button
                onClick={() => window.open("/api/reportes/pdf-dia", "_blank")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/20 transition-colors"
              >
                <Download size={11} /> PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ background: "#0A0A0C" }}>
                <tr className="border-b border-white/5">
                  {["Mesa", "Hora", "Producto", "Cant.", "Precio Unit.", "Subtotal"].map((h, i) => (
                    <th key={h} className={`text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-4 py-3 ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allProductos.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-16 text-center text-zinc-700 text-sm">Aún no hay productos vendidos en este turno</td></tr>
                ) : (
                  <>
                    {allProductos.map((it, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-sm font-bold text-white">{it.mesa}</td>
                        <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">{it.hora}</td>
                        <td className="px-4 py-2.5 text-sm text-zinc-300">{it.emoji} {it.nombre}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-mono text-zinc-400">{it.cantidad}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-mono text-zinc-500">{formatPrice(it.precio)}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-mono font-bold text-red-400">{formatPrice(it.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-white/10">
                      <td colSpan={5} className="px-4 py-3 font-bold text-sm text-white">TOTAL GENERAL</td>
                      <td className="px-4 py-3 font-mono font-black text-lg text-right" style={{ color: "#FF2D2D" }}>{formatPrice(totalProductos)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
