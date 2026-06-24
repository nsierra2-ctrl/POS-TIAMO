import { useState, useEffect, useCallback } from "react";
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
import {
  Banknote, CreditCard, TrendingUp, Lock, Unlock, Clock,
  AlertTriangle, CheckCircle2, History, Wallet, Download,
  Package, XCircle, RefreshCw, Calendar, ArrowUpRight, ArrowDownLeft,
} from "lucide-react";
import { RecordExportBar } from "@/components/record-export-bar";
import { PremiumBackground } from "@/components/premium-background";
import { useSSE } from "@/hooks/use-sse";

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

function SesionCard({ s, index }: { s: any; index: number }) {
  const estaAbierta = s.estado === "abierta";
  const diferencia = s.diferencia ?? 0;
  const diferenciaPos = diferencia >= 0;

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        background: estaAbierta
          ? "rgba(34,197,94,0.04)"
          : "rgba(255,255,255,0.02)",
        borderColor: estaAbierta ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
            style={{
              background: estaAbierta
                ? "linear-gradient(135deg,#22c55e,#15803d)"
                : "linear-gradient(135deg,#3f3f46,#27272a)",
              color: "white",
            }}
          >
            #{index + 1}
          </div>
          <div>
            <div className="font-black text-white text-sm">{s.usuarioNombre}</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(s.aperturaEn).toLocaleString("es-CO", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        <span
          className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
          style={{
            background: estaAbierta ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
            color: estaAbierta ? "#22c55e" : "#71717a",
          }}
        >
          {estaAbierta ? "● ABIERTA" : "CERRADA"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/3 border border-white/5 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Fondo inicial</div>
          <div className="font-mono font-bold text-sm text-zinc-300">{formatPrice(s.montoInicial ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-white/3 border border-white/5 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Pedidos</div>
          <div className="font-mono font-bold text-sm text-zinc-300">{s.cantidadPedidos ?? 0}</div>
        </div>
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Efectivo</div>
          <div className="font-mono font-bold text-sm text-emerald-400">{formatPrice(s.totalEfectivo ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Tarjeta</div>
          <div className="font-mono font-bold text-sm text-violet-400">{formatPrice(s.totalTarjeta ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Transfer.</div>
          <div className="font-mono font-bold text-sm text-blue-400">{formatPrice(s.totalTransferencia ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Propinas</div>
          <div className="font-mono font-bold text-sm text-amber-400">{formatPrice(s.totalPropinas ?? 0)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div>
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Total ventas</div>
          <div className="font-mono font-black text-white">{formatPrice(s.totalVentas ?? 0)}</div>
        </div>
        {s.cierreEn && (
          <div className="text-right">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Diferencia arqueo</div>
            <div className={`font-mono font-black flex items-center gap-1 justify-end ${diferenciaPos ? "text-emerald-400" : "text-red-400"}`}>
              {diferenciaPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
              {diferenciaPos ? "+" : ""}{formatPrice(diferencia)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HistorialCard({ h, index }: { h: any; index: number }) {
  const diferencia = h.diferencia ?? 0;
  const diferenciaPos = diferencia >= 0;
  const esReset = h.tipo === "reset";

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        background: esReset ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.02)",
        borderColor: esReset ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xs"
            style={{
              background: esReset
                ? "linear-gradient(135deg,#ef4444,#991b1b)"
                : "linear-gradient(135deg,#3f3f46,#27272a)",
              color: "white",
            }}
          >
            #{index + 1}
          </div>
          <div>
            <div className="font-black text-white text-sm">{h.usuarioNombre}</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(h.fecha).toLocaleString("es-CO", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        <span
          className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
          style={{
            background: esReset ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
            color: esReset ? "#ef4444" : "#71717a",
          }}
        >
          {esReset ? "⚠ RESET" : "CIERRE"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/3 border border-white/5 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Fondo inicial</div>
          <div className="font-mono font-bold text-sm text-zinc-300">{formatPrice(h.montoInicial ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-white/3 border border-white/5 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Pedidos cobrados</div>
          <div className="font-mono font-bold text-sm text-zinc-300">{h.cantidadPedidos ?? 0}</div>
        </div>
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Efectivo</div>
          <div className="font-mono font-bold text-sm text-emerald-400">{formatPrice(h.totalEfectivo ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Tarjeta</div>
          <div className="font-mono font-bold text-sm text-violet-400">{formatPrice(h.totalTarjeta ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Transfer.</div>
          <div className="font-mono font-bold text-sm text-blue-400">{formatPrice(h.totalTransferencia ?? 0)}</div>
        </div>
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 px-3 py-2">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Propinas</div>
          <div className="font-mono font-bold text-sm text-amber-400">{formatPrice(h.totalPropinas ?? 0)}</div>
        </div>
      </div>

      {h.notas && (
        <div className="text-xs text-zinc-600 italic border-t border-white/5 pt-3">{h.notas}</div>
      )}

      <div className="flex items-center justify-between border-t border-white/5 pt-1">
        <div>
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Total ventas</div>
          <div className="font-mono font-black text-white">{formatPrice(h.totalVentas ?? 0)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Diferencia</div>
          <div className={`font-mono font-black flex items-center gap-1 justify-end ${diferenciaPos ? "text-emerald-400" : "text-red-400"}`}>
            {diferenciaPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
            {diferenciaPos ? "+" : ""}{formatPrice(diferencia)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CajaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sesionActiva, isLoading: isSesionLoading } = useGetCajaSesionActiva({
    query: { queryKey: getGetCajaSesionActivaQueryKey(), refetchInterval: 30000 },
  });
  const { data: resumenDia } = useGetCajaResumenDia({
    query: { queryKey: getGetCajaResumenDiaQueryKey(), refetchInterval: 30000 },
  });
  const { data: sesiones } = useGetCajaSesiones({
    query: { queryKey: getGetCajaSesionesQueryKey(), refetchInterval: 60000 },
  });

  const abrirMutation = useAbrirCaja();
  const cerrarMutation = useCerrarCaja();

  const [montoInicialStr, setMontoInicialStr] = useState("50000");
  const [notasApertura, setNotasApertura] = useState("");
  const [efectivoContadoStr, setEfectivoContadoStr] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [resultadoCierre, setResultadoCierre] = useState<any>(null);
  const [tab, setTab] = useState<"caja" | "sesiones" | "historial">("caja");
  const [historialPersistente, setHistorialPersistente] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [pedidosDia, setPedidosDia] = useState<any[]>([]);

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString("es-CO") : "";
  };

  const parseInput = (str: string) => parseInt(str.replace(/\D/g, "") || "0") || 0;

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
    const t = setInterval(fetchPedidosDia, 30000);
    return () => clearInterval(t);
  }, [fetchPedidosDia]);

  const cargarHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const r = await fetch(`${base}/api/admin/historial-caja`, { credentials: "include" });
      if (!r.ok) throw new Error("Error al cargar historial");
      setHistorialPersistente(await r.json());
    } catch {
      toast({ title: "Error", description: "No se pudo cargar el historial", variant: "destructive" });
    } finally {
      setLoadingHistorial(false);
    }
  }, [toast]);

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
  const mesasCobradas = (resumenDia as any)?.mesasCobradas ?? 0;
  const mesasAbiertas = (resumenDia as any)?.mesasAbiertas ?? 0;
  const hayMesasPendientes = mesasCobradas + mesasAbiertas > 0;

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
    }));
  });
  const totalProductos = allProductos.reduce((s, i) => s + i.subtotal, 0);

  const tabs = [
    { key: "caja", label: "Caja", icon: Banknote },
    { key: "sesiones", label: "Sesiones", icon: History },
    { key: "historial", label: "Historial Global", icon: Clock },
  ] as const;

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
            <div className="flex gap-2 items-center flex-wrap">
              <RecordExportBar
                title="Sesiones de Caja"
                filename={`caja-sesiones-${new Date().toISOString().slice(0, 10)}`}
                rows={(sesiones ?? []).map((s: any) => ({
                  id: s.id,
                  usuario: s.usuarioNombre,
                  apertura: new Date(s.aperturaEn).toLocaleString("es-CO"),
                  cierre: s.cierreEn ? new Date(s.cierreEn).toLocaleString("es-CO") : "—",
                  montoInicial: s.montoInicial,
                  totalVentas: s.totalVentas ?? 0,
                  cantidadPedidos: s.cantidadPedidos ?? 0,
                  totalEfectivo: s.totalEfectivo,
                  totalTransferencia: s.totalTransferencia,
                  totalPropinas: s.totalPropinas,
                  diferencia: s.diferencia,
                  estado: s.estado,
                }))}
              />
              <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTab(key);
                      if (key === "historial") cargarHistorial();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      tab === key
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TAB: CAJA */}
          {tab === "caja" && (
            <>
              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <MetricCard label="Efectivo Hoy" value={formatPrice(resumenDia?.totalEfectivo ?? 0)} icon={Banknote} color="#22c55e" />
                <MetricCard label="Tarjeta" value={formatPrice(resumenDia?.totalTarjeta ?? 0)} icon={CreditCard} color="#8b5cf6" />
                <MetricCard label="Transferencias" value={formatPrice(resumenDia?.totalTransferencia ?? 0)} icon={Wallet} color="#3b82f6" />
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
                      {haySesion
                        ? <Unlock className="w-7 h-7 text-white icon-3d-inner" strokeWidth={2.5} />
                        : <Lock className="w-7 h-7 text-white icon-3d-inner" strokeWidth={2.5} />}
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
                          ["Total ventas", formatPrice(resultadoCierre.totalVentas ?? 0)],
                          ["Pedidos cobrados", String(resultadoCierre.pedidosCobrados ?? 0)],
                          ["Efectivo en sistema", formatPrice(resultadoCierre.totalEfectivo)],
                          ["Tarjeta", formatPrice(resultadoCierre.totalTarjeta ?? 0)],
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
                      <button
                        onClick={() => window.open("/api/reportes/pdf-dia", "_blank")}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-zinc-300 hover:text-white text-sm font-bold transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Ver PDF del Cierre
                      </button>
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
                      {hayMesasPendientes && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-400 leading-relaxed">
                            <strong>No se puede cerrar:</strong>{" "}
                            {mesasCobradas > 0 && `${mesasCobradas} mesa(s) COBRADA(S) pendiente(s).`}{" "}
                            {mesasAbiertas > 0 && `${mesasAbiertas} mesa(s) OCUPADA(S) sin cobrar.`}{" "}
                            Cierra todas las mesas primero.
                          </p>
                        </div>
                      )}
                      <Button
                        onClick={handleCerrar}
                        disabled={cerrarMutation.isPending || !efectivoContadoStr || hayMesasPendientes}
                        className="w-full h-12 font-black text-base"
                        style={{ background: hayMesasPendientes ? undefined : "linear-gradient(135deg,#FF2D2D,#CC0000)" }}
                      >
                        {cerrarMutation.isPending ? "Cerrando..." : "Cerrar Caja"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Resumen del turno */}
                <div className="rounded-2xl border border-white/5 p-6 space-y-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm text-white">Resumen del Turno</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 ml-auto">LIVE</span>
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

              {/* Productos vendidos hoy — siempre visible (vacío o no) */}
              <div className="mt-6 rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-white">Productos Vendidos — Turno Actual</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">LIVE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600">{allProductos.length} items · {formatPrice(totalProductos)}</span>
                    <button
                      onClick={fetchPedidosDia}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold border border-white/10 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Actualizar
                    </button>
                    <button
                      onClick={() => window.open("/api/reportes/pdf-dia", "_blank")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/20 transition-colors"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                  </div>
                </div>
                {allProductos.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-600 text-sm">Sin ventas en el turno actual. Las ventas aparecerán aquí en tiempo real.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10" style={{ background: "#0A0A0C" }}>
                        <tr className="border-b border-white/5">
                          {["Mesa", "Hora", "Producto", "Cant.", "Precio Unit.", "Subtotal"].map((h, i) => (
                            <th key={h} className={`text-[10px] font-bold text-zinc-600 uppercase tracking-wider px-4 py-3 ${i >= 3 ? "text-right" : "text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allProductos.map((it, i) => (
                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                            <td className="px-4 py-2.5 font-mono text-sm font-bold text-white">{it.mesa}</td>
                            <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">{it.hora}</td>
                            <td className="px-4 py-2.5 text-sm text-zinc-300">{it.emoji} {it.nombre}</td>
                            <td className="px-4 py-2.5 text-sm text-right font-mono text-zinc-400">{it.cantidad}</td>
                            <td className="px-4 py-2.5 text-sm text-right font-mono text-zinc-500">{formatPrice(it.precio)}</td>
                            <td className="px-4 py-2.5 text-sm text-right font-mono font-bold text-red-400">{formatPrice(it.subtotal)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-white/10">
                          <td colSpan={5} className="px-4 py-3 font-bold text-sm text-white">TOTAL TURNO</td>
                          <td className="px-4 py-3 font-mono font-black text-lg text-right" style={{ color: "#FF2D2D" }}>{formatPrice(totalProductos)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB: SESIONES */}
          {tab === "sesiones" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Sesiones de Caja</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">Historial de aperturas y cierres del turno actual</p>
                </div>
                <span className="text-xs text-zinc-600 font-mono">{sesiones?.length ?? 0} sesiones</span>
              </div>
              {!sesiones?.length ? (
                <div className="rounded-2xl border border-white/5 p-16 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <History className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">Sin sesiones registradas aún.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(sesiones ?? []).map((s: any, i: number) => (
                    <SesionCard key={s.id} s={s} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: HISTORIAL GLOBAL */}
          {tab === "historial" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Historial Global de Caja</h2>
                  <p className="text-zinc-500 text-sm mt-0.5">Registros persistentes de todos los cierres y resets</p>
                </div>
                <button
                  onClick={cargarHistorial}
                  disabled={loadingHistorial}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistorial ? "animate-spin" : ""}`} />
                  {loadingHistorial ? "Cargando..." : "Recargar"}
                </button>
              </div>

              {loadingHistorial ? (
                <div className="rounded-2xl border border-white/5 p-16 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <RefreshCw className="w-8 h-8 text-zinc-700 mx-auto mb-3 animate-spin" />
                  <p className="text-zinc-600 text-sm">Cargando historial...</p>
                </div>
              ) : !historialPersistente.length ? (
                <div className="rounded-2xl border border-white/5 p-16 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">Sin registros históricos aún.</p>
                  <p className="text-zinc-700 text-xs mt-1">Los datos se guardan automáticamente al cerrar caja o hacer reset.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historialPersistente.map((h: any, i: number) => (
                    <HistorialCard key={h.id} h={h} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
