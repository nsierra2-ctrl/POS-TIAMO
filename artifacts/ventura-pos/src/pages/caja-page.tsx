import { useState } from "react";
import { Navigation } from "@/components/navigation";
import {
  useGetCajaSesionActiva,
  useAbrirCaja,
  useCerrarCaja,
  useGetCajaResumenDia,
  useGetCajaSesiones,
  getGetCajaSesionActivaQueryKey,
  getGetCajaResumenDiaQueryKey,
  getGetCajaSesionesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/constants";
import { Banknote, CreditCard, TrendingUp, Lock, Unlock, Clock, AlertTriangle, CheckCircle2, History, Wallet } from "lucide-react";
import { RecordExportBar } from "@/components/record-export-bar";
import { PremiumBackground } from "@/components/premium-background";

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + "20" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-black font-mono text-white">{value}</div>
    </div>
  );
}

export default function CajaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sesionActiva, isLoading: isSesionLoading } = useGetCajaSesionActiva({
    query: { queryKey: getGetCajaSesionActivaQueryKey(), refetchInterval: 10000 },
  });
  const { data: resumenDia } = useGetCajaResumenDia({
    query: { queryKey: getGetCajaResumenDiaQueryKey(), refetchInterval: 15000 },
  });
  const { data: sesiones } = useGetCajaSesiones({
    query: { queryKey: getGetCajaSesionesQueryKey() },
  });

  const abrirMutation = useAbrirCaja();
  const cerrarMutation = useCerrarCaja();

  const [montoInicialStr, setMontoInicialStr] = useState("50000");
  const [notasApertura, setNotasApertura] = useState("");
  const [efectivoContadoStr, setEfectivoContadoStr] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [resultadoCierre, setResultadoCierre] = useState<any>(null);
  const [tab, setTab] = useState<"caja" | "historial" | "historial-persistente">("caja");
  const [historialPersistente, setHistorialPersistente] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString("es-CO") : "";
  };

  const parseInput = (str: string) => parseInt(str.replace(/\D/g, "") || "0") || 0;

  const handleAbrir = async () => {
    const montoInicial = parseInput(montoInicialStr);
    try {
      await abrirMutation.mutateAsync({ data: { montoInicial, notas: notasApertura || undefined } });
      queryClient.invalidateQueries({ queryKey: getGetCajaSesionActivaQueryKey() });
      toast({ title: "¡Caja abierta!", description: `Fondo inicial: ${formatPrice(montoInicial)}` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "No se pudo abrir la caja", variant: "destructive" });
    }
  };

  const handleCerrar = async () => {
    const efectivoContado = parseInput(efectivoContadoStr);
    try {
      const r = await cerrarMutation.mutateAsync({ data: { efectivoContado, notas: notasCierre || undefined } });
      setResultadoCierre(r);
      queryClient.invalidateQueries({ queryKey: getGetCajaSesionActivaQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCajaResumenDiaQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetCajaSesionesQueryKey() });
      toast({ title: "¡Caja cerrada!", description: `Diferencia: ${formatPrice(r.diferencia ?? 0)}` });
    } catch (e: any) {
      toast({ title: "Error al cerrar caja", description: e?.message ?? "Error desconocido", variant: "destructive" });
    }
  };

  const haySesion = !!sesionActiva;

  const cargarHistorialPersistente = async () => {
    setLoadingHistorial(true);
    try {
      const r = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/admin/historial-caja`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Error al cargar historial");
      const data = await r.json();
      setHistorialPersistente(data);
    } catch (e) {
      toast({ title: "Error", description: "No se pudo cargar el historial de caja", variant: "destructive" });
    } finally {
      setLoadingHistorial(false);
    }
  };

  return (
    <div className="min-h-screen text-white pb-20 md:pb-0 relative" style={{ background: "#070708" }}>
      <PremiumBackground />
      <div className="relative z-10">
      <Navigation />

      <main className="p-4 md:p-8 max-w-screen-xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="icon-3d w-16 h-16 rounded-2xl flex items-center justify-center icon-float-idle"
              style={{
                background: haySesion
                  ? "linear-gradient(135deg,#22c55e 0%,#15803d 100%)"
                  : "linear-gradient(135deg,#FF2D2D 0%,#991b1b 100%)",
                boxShadow: haySesion
                  ? "0 12px 40px rgba(34,197,94,0.45), inset 0 2px 0 rgba(255,255,255,0.2)"
                  : "0 12px 40px rgba(255,45,45,0.45), inset 0 2px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Wallet className="w-8 h-8 text-white icon-3d-inner" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight font-display">Control de Caja</h1>
              <p className="text-zinc-500 text-sm mt-0.5">Apertura · Cierre · Arqueo · Reportes</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <RecordExportBar
              title="Sesiones de Caja"
              filename={`caja-sesiones-${new Date().toISOString().slice(0,10)}`}
              rows={(sesiones ?? []).map((s: any) => ({
                id: s.id,
                usuario: s.usuarioNombre,
                apertura: new Date(s.aperturaEn).toLocaleString("es-CO"),
                cierre: s.cierreEn ? new Date(s.cierreEn).toLocaleString("es-CO") : "—",
                montoInicial: s.montoInicial,
                totalEfectivo: s.totalEfectivo,
                totalTransferencia: s.totalTransferencia,
                totalPropinas: s.totalPropinas,
                diferencia: s.diferencia,
                estado: s.estado,
              }))}
            />
            <div className="ml-2 flex gap-1">
              <button
                onClick={() => setTab("caja")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "caja" ? "bg-white/10 text-white border border-white/10" : "text-zinc-500 hover:text-white"}`}
              >
                <Banknote size={14} /> Caja
              </button>
              <button
                onClick={() => setTab("historial")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "historial" ? "bg-white/10 text-white border border-white/10" : "text-zinc-500 hover:text-white"}`}
              >
                <History size={14} /> Sesiones
              </button>
              <button
                onClick={() => { setTab("historial-persistente"); cargarHistorialPersistente(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "historial-persistente" ? "bg-white/10 text-white border border-white/10" : "text-zinc-500 hover:text-white"}`}
              >
                <History size={14} /> Historial Global
              </button>
            </div>
          </div>
        </div>

        {tab === "caja" && (
          <>
            {/* Resumen del día */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Efectivo Hoy" value={formatPrice(resumenDia?.totalEfectivo ?? 0)} icon={Banknote} color="#22c55e" />
              <MetricCard label="Transferencias" value={formatPrice(resumenDia?.totalTransferencia ?? 0)} icon={CreditCard} color="#3b82f6" />
              <MetricCard label="Propinas" value={formatPrice(resumenDia?.totalPropinas ?? 0)} icon={TrendingUp} color="#f59e0b" />
              <MetricCard label="Pedidos Cobrados" value={String(resumenDia?.pedidosCobrados ?? 0)} icon={CheckCircle2} color="#a855f7" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estado de la caja */}
              <div
                className={`rounded-3xl border p-6 relative overflow-hidden ${haySesion ? "caja-pulse-emerald" : ""}`}
                style={{
                  background: "linear-gradient(160deg,rgba(20,20,24,0.95) 0%,rgba(12,12,15,0.99) 100%)",
                  borderColor: haySesion ? "rgba(34,197,94,0.25)" : "rgba(255,45,45,0.18)",
                  boxShadow: haySesion
                    ? "inset 0 0 60px rgba(34,197,94,0.05), 0 12px 40px rgba(34,197,94,0.08)"
                    : "inset 0 0 60px rgba(255,45,45,0.04), 0 12px 40px rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="icon-3d w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{
                      background: haySesion
                        ? "linear-gradient(135deg,#22c55e 0%,#15803d 100%)"
                        : "linear-gradient(135deg,#52525b 0%,#27272a 100%)",
                      boxShadow: haySesion
                        ? "0 8px 24px rgba(34,197,94,0.4), inset 0 2px 0 rgba(255,255,255,0.2)"
                        : "0 8px 24px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.1)",
                    }}
                  >
                    {haySesion ? <Unlock className="w-7 h-7 text-white icon-3d-inner" strokeWidth={2.5} /> : <Lock className="w-7 h-7 text-white icon-3d-inner" strokeWidth={2.5} />}
                  </div>
                  <div>
                    <div className={`text-xl font-black ${haySesion ? "text-emerald-400 neon-emerald" : "text-zinc-400"}`}>
                      {isSesionLoading ? "..." : haySesion ? "CAJA ABIERTA" : "CAJA CERRADA"}
                    </div>
                    {haySesion && sesionActiva && (
                      <div className="text-xs text-zinc-500">
                        Abierta por {(sesionActiva as any).usuarioNombre} · Fondo: {formatPrice((sesionActiva as any).montoInicial ?? 0)}
                      </div>
                    )}
                  </div>
                </div>

                {!haySesion ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Fondo inicial</label>
                      <Input
                        value={montoInicialStr}
                        onChange={(e) => setMontoInicialStr(formatInput(e.target.value))}
                        className="bg-white/5 border-white/10 text-white font-mono text-lg h-12"
                        placeholder="$50.000"
                      />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {[20000, 50000, 100000, 200000].map((v) => (
                          <button key={v} onClick={() => setMontoInicialStr(v.toLocaleString("es-CO"))}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:bg-white/10 transition-colors">
                            {formatPrice(v)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Notas (opcional)</label>
                      <Input
                        value={notasApertura}
                        onChange={(e) => setNotasApertura(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Ej: Turno mañana"
                      />
                    </div>
                    <Button
                      onClick={handleAbrir}
                      disabled={abrirMutation.isPending}
                      className="w-full h-12 font-black text-base"
                      style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
                    >
                      {abrirMutation.isPending ? "Abriendo..." : "✓ Abrir Caja"}
                    </Button>
                  </div>
                ) : resultadoCierre ? (
                  <div className="space-y-3">
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <div className="text-xl font-black text-white">Caja Cerrada</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        ["Efectivo en sistema", formatPrice(resultadoCierre.totalEfectivo)],
                        ["Fondo inicial", formatPrice((resultadoCierre as any).montoInicial ?? 0)],
                        ["Efectivo esperado", formatPrice(resultadoCierre.efectivoEsperado)],
                        ["Efectivo contado", formatPrice(resultadoCierre.efectivoContado)],
                        ["Transferencias", formatPrice(resultadoCierre.totalTransferencia)],
                        ["Propinas", formatPrice(resultadoCierre.totalPropinas)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-500">{k}</span>
                          <span className="font-mono font-bold">{v}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2">
                        <span className="font-bold text-white">Diferencia</span>
                        <span className={`font-black font-mono text-lg ${resultadoCierre.diferencia >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {resultadoCierre.diferencia >= 0 ? "+" : ""}{formatPrice(resultadoCierre.diferencia)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-400/80">Cuenta el efectivo en caja antes de cerrar. El sistema calcula la diferencia automáticamente.</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Efectivo contado en caja</label>
                      <Input
                        value={efectivoContadoStr}
                        onChange={(e) => setEfectivoContadoStr(formatInput(e.target.value))}
                        className="bg-white/5 border-white/10 text-white font-mono text-lg h-12"
                        placeholder="$0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Observaciones (opcional)</label>
                      <Input
                        value={notasCierre}
                        onChange={(e) => setNotasCierre(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Notas del cierre..."
                      />
                    </div>
                    <Button
                      onClick={handleCerrar}
                      disabled={cerrarMutation.isPending || !efectivoContadoStr}
                      className="w-full h-12 font-black text-base"
                      style={{ background: "linear-gradient(135deg,#FF2D2D,#CC0000)" }}
                    >
                      {cerrarMutation.isPending ? "Cerrando..." : "Cerrar Caja"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Info turno actual */}
              <div className="rounded-2xl border border-white/5 p-6 space-y-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm text-white">Resumen del Turno</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Total ventas", value: formatPrice((resumenDia?.totalVentas ?? 0)), color: "#FF2D2D" },
                    { label: "Efectivo", value: formatPrice(resumenDia?.totalEfectivo ?? 0), color: "#22c55e" },
                    { label: "Transferencia", value: formatPrice(resumenDia?.totalTransferencia ?? 0), color: "#3b82f6" },
                    { label: "Propinas", value: formatPrice(resumenDia?.totalPropinas ?? 0), color: "#f59e0b" },
                    { label: "Pedidos cobrados", value: String(resumenDia?.pedidosCobrados ?? 0), color: "#a855f7" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-zinc-400">{label}</span>
                      <span className="font-black font-mono text-lg" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "historial-persistente" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white tracking-tight">Historial Persistente de Caja</h2>
              <span className="text-xs text-zinc-500">Guardado automáticamente tras cada cierre o reset</span>
            </div>
            <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <span className="font-bold text-sm text-white">Registros Históricos</span>
                <span className="text-xs text-zinc-600">{historialPersistente.length} registros</span>
              </div>
              {loadingHistorial ? (
                <div className="p-8 text-center text-zinc-600 text-sm">Cargando historial...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {["Fecha", "Usuario", "Monto Inicial", "Efectivo", "Transfer.", "Propinas", "Ventas", "Pedidos", "Diferencia", "Tipo"].map((h) => (
                          <th key={h} className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(historialPersistente ?? []).map((h: any) => (
                        <tr key={h.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                          <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{new Date(h.fecha).toLocaleString("es-CO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-white">{h.usuarioNombre}</td>
                          <td className="px-4 py-3 font-mono text-sm text-zinc-400">{formatPrice(h.montoInicial)}</td>
                          <td className="px-4 py-3 font-mono text-sm text-emerald-400">{formatPrice(h.totalEfectivo)}</td>
                          <td className="px-4 py-3 font-mono text-sm text-blue-400">{formatPrice(h.totalTransferencia)}</td>
                          <td className="px-4 py-3 font-mono text-sm text-amber-400">{formatPrice(h.totalPropinas)}</td>
                          <td className="px-4 py-3 font-mono text-sm text-white">{formatPrice(h.totalVentas)}</td>
                          <td className="px-4 py-3 font-mono text-sm text-zinc-400">{h.cantidadPedidos}</td>
                          <td className="px-4 py-3 font-mono text-sm">
                            <span className={h.diferencia >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {h.diferencia >= 0 ? "+" : ""}{formatPrice(h.diferencia)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${h.tipo === "reset" ? "bg-red-500/10 text-red-400" : "bg-zinc-500/10 text-zinc-500"}`}>
                              {h.tipo}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!historialPersistente?.length && (
                        <tr><td colSpan={10} className="px-4 py-12 text-center text-zinc-700 text-sm">Sin registros históricos aún. Los datos se guardan automáticamente al cerrar caja o hacer reset.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "historial" && (
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="px-5 py-4 border-b border-white/5">
              <span className="font-bold text-sm text-white">Historial de Sesiones</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["ID", "Usuario", "Apertura", "Cierre", "Efectivo", "Transfer.", "Propinas", "Diferencia", "Estado"].map((h) => (
                      <th key={h} className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(sesiones ?? []).map((s: any) => (
                    <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="px-4 py-3 font-mono text-sm text-zinc-500">#{s.id}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{s.usuarioNombre}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{new Date(s.aperturaEn).toLocaleString("es-CO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{s.cierreEn ? new Date(s.cierreEn).toLocaleString("es-CO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td className="px-4 py-3 font-mono text-sm text-emerald-400">{formatPrice(s.totalEfectivo)}</td>
                      <td className="px-4 py-3 font-mono text-sm text-blue-400">{formatPrice(s.totalTransferencia)}</td>
                      <td className="px-4 py-3 font-mono text-sm text-amber-400">{formatPrice(s.totalPropinas)}</td>
                      <td className="px-4 py-3 font-mono text-sm">
                        <span className={s.diferencia >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {s.diferencia >= 0 ? "+" : ""}{formatPrice(s.diferencia)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${s.estado === "abierta" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-500"}`}>
                          {s.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!sesiones?.length && (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-700 text-sm">Sin sesiones registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
