import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  useGetMesas,
  useGetPedidos,
  getGetMesasQueryKey,
  getGetPedidosQueryKey,
} from "@workspace/api-client-react";
import { Navigation } from "@/components/navigation";
import { PremiumBackground } from "@/components/premium-background";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CobrarModal } from "@/components/cobrar-modal";
import { formatPrice } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, Users, ShoppingCart, Banknote, UtensilsCrossed, Clock, CheckCircle2, ChefHat, LayoutGrid, Search, TrendingUp, DoorOpen, Receipt, Printer } from "lucide-react";

function useTimer(startedAt?: string | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return null;
  const m = Math.floor(elapsed / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

const ESTADO_CONFIG = {
  libre: {
    border: "rgba(34,197,94,0.18)",
    borderHover: "rgba(34,197,94,0.55)",
    glow: "rgba(34,197,94,0.06)",
    glowHover: "rgba(34,197,94,0.14)",
    glowPulse: "0 0 0 1px rgba(34,197,94,0.12)",
    dot: "#22c55e",
    label: "LIBRE",
    labelBg: "rgba(34,197,94,0.09)",
    labelColor: "#22c55e",
    icon: CheckCircle2,
    headerColor: "from-emerald-950/30",
  },
  ocupada: {
    border: "rgba(245,158,11,0.25)",
    borderHover: "rgba(245,158,11,0.6)",
    glow: "rgba(245,158,11,0.07)",
    glowHover: "rgba(245,158,11,0.16)",
    glowPulse: "0 0 0 1px rgba(245,158,11,0.15)",
    dot: "#f59e0b",
    label: "OCUPADA",
    labelBg: "rgba(245,158,11,0.09)",
    labelColor: "#f59e0b",
    icon: Users,
    headerColor: "from-amber-950/30",
  },
  lista_cobro: {
    border: "rgba(168,85,247,0.35)",
    borderHover: "rgba(168,85,247,0.65)",
    glow: "rgba(168,85,247,0.09)",
    glowHover: "rgba(168,85,247,0.22)",
    glowPulse: "0 0 0 1px rgba(168,85,247,0.2)",
    dot: "#a855f7",
    label: "LISTA COBRO",
    labelBg: "rgba(168,85,247,0.1)",
    labelColor: "#c084fd",
    icon: Receipt,
    headerColor: "from-purple-950/30",
  },
  en_pago: {
    border: "rgba(99,102,241,0.35)",
    borderHover: "rgba(99,102,241,0.65)",
    glow: "rgba(99,102,241,0.09)",
    glowHover: "rgba(99,102,241,0.22)",
    glowPulse: "0 0 0 1px rgba(99,102,241,0.2)",
    dot: "#6366f1",
    label: "EN PAGO",
    labelBg: "rgba(99,102,241,0.1)",
    labelColor: "#818cf8",
    icon: Banknote,
    headerColor: "from-indigo-950/30",
  },
  finalizada: {
    border: "rgba(99,102,241,0.2)",
    borderHover: "rgba(99,102,241,0.5)",
    glow: "rgba(99,102,241,0.05)",
    glowHover: "rgba(99,102,241,0.15)",
    glowPulse: "0 0 0 1px rgba(99,102,241,0.1)",
    dot: "#4f46e5",
    label: "FINALIZADA",
    labelBg: "rgba(99,102,241,0.08)",
    labelColor: "#6366f1",
    icon: DoorOpen,
    headerColor: "from-indigo-950/20",
  },
};

function MesaCard({ mesa, pedido, onClick, index }: { mesa: any; pedido: any; onClick: () => void; index: number }) {
  const cfg = ESTADO_CONFIG[mesa.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.libre;
  const Icon = cfg.icon;
  const timer = useTimer(pedido?.creadoEn);
  const isOcupada = mesa.estado !== "libre" && mesa.estado !== "finalizada";
  const urgente = pedido && timer && parseInt(timer) > 30;
  const isCocinando = mesa.estado === "en_pago";
  const isListaCobro = mesa.estado === "lista_cobro";
  const isFinalizada = mesa.estado === "finalizada";
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="relative rounded-3xl text-left group overflow-hidden mesa-card-enter"
      style={{
        background: `linear-gradient(145deg, rgba(20,20,24,0.96) 0%, rgba(12,12,15,0.99) 100%)`,
        border: `1.5px solid ${cfg.border}`,
        boxShadow: `inset 0 0 50px ${cfg.glow}, ${cfg.glowPulse}, 0 4px 16px rgba(0,0,0,0.3)`,
        minHeight: "13rem",
        animationDelay: `${index * 40}ms`,
        transition: "border-color 0.3s var(--ease-spring), box-shadow 0.3s var(--ease-spring), transform 0.25s var(--ease-spring)",
        transformStyle: "preserve-3d",
      }}
      onMouseMove={(e) => {
        const el = e.currentTarget as HTMLElement;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px) scale(1.03)`;
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = cfg.borderHover;
        el.style.boxShadow = `inset 0 0 70px ${cfg.glowHover}, 0 18px 50px ${cfg.glow}, ${cfg.glowPulse}, 0 0 60px ${cfg.glow}`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = cfg.border;
        el.style.boxShadow = `inset 0 0 50px ${cfg.glow}, ${cfg.glowPulse}, 0 4px 16px rgba(0,0,0,0.3)`;
        el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0) scale(1)";
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "perspective(900px) translateY(0) scale(0.97)";
      }}
    >
      {/* Background gradient header stripe */}
      <div
        className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b ${cfg.headerColor} to-transparent`}
        style={{ pointerEvents: "none" }}
      />

      {/* Shimmer on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(135deg, transparent 40%, ${cfg.glow} 50%, transparent 60%)`,
          backgroundSize: "200% 200%",
          animation: "shimmer 2s ease-in-out infinite",
        }}
      />

      {/* Pulsing border for cocinando */}
      {isCocinando && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            animation: "mesa-glow-pulse 2.5s ease-in-out infinite",
            zIndex: 0,
          }}
        />
      )}

      {/* Status dot */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor: cfg.dot,
            boxShadow: `0 0 8px ${cfg.dot}`,
            animation: isCocinando ? "dot-pulse 1.8s ease-in-out infinite" : isOcupada ? "dot-pulse 4s ease-in-out infinite" : "none",
          }}
        />
      </div>

      {/* Urgency badge */}
      {urgente && (
        <div
          className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-md text-white text-[9px] font-black uppercase tracking-wide animate-pulse"
          style={{ background: "#FF2D2D", boxShadow: "0 2px 8px rgba(255,45,45,0.5)" }}
        >
          !
        </div>
      )}

      <div className="relative z-10 p-4 pt-8 flex flex-col gap-2 h-full">
        {/* Number + icon */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Mesa</div>
            <div
              className="text-7xl font-black text-white font-mono leading-none tracking-tighter"
              style={{
                textShadow: isOcupada ? `0 0 32px ${cfg.dot}60` : `0 0 20px rgba(255,255,255,0.05)`,
              }}
            >
              {mesa.numero}
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{
              background: cfg.labelBg,
              border: `1.5px solid ${cfg.border}`,
              boxShadow: `0 4px 12px ${cfg.glow}`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: cfg.labelColor }} />
          </div>
        </div>

        {/* Info section */}
        {isOcupada ? (
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-zinc-500 text-xs">
                <Users className="w-3 h-3" />
                <span className="font-semibold">{mesa.personas || "?"} pers.</span>
              </div>
              {timer && (
                <div
                  className="flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg"
                  style={{
                    color: urgente ? "#FF2D2D" : "#f59e0b",
                    background: urgente ? "rgba(255,45,45,0.08)" : "rgba(245,158,11,0.06)",
                    border: `1px solid ${urgente ? "rgba(255,45,45,0.2)" : "rgba(245,158,11,0.15)"}`,
                  }}
                >
                  <Clock className="w-3 h-3" />
                  {timer}
                </div>
              )}
            </div>
            {pedido && (
              <div
                className="flex items-center justify-between pt-1.5 border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3 text-zinc-600" />
                  <span className="text-[10px] text-zinc-600 font-medium">
                    {pedido.items?.length ?? 0} ítem{(pedido.items?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <span
                  className="text-xs font-black font-mono"
                  style={{ color: "#FF2D2D", textShadow: "0 0 12px rgba(255,45,45,0.3)" }}
                >
                  {formatPrice(pedido.total)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
              style={{ background: cfg.labelBg, color: cfg.labelColor }}
            >
              Disponible
            </span>
            <span className="text-[10px] text-zinc-700">· Toca para asignar</span>
          </div>
        )}
      </div>
    </button>
  );
}

export default function MeseroPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mesas, isLoading } = useGetMesas({
    query: { queryKey: getGetMesasQueryKey(), refetchInterval: 4000 },
  });
  const { data: pedidos } = useGetPedidos(
    { estado: "nuevo,preparando,listo,cobrado" },
    { query: { queryKey: getGetPedidosQueryKey({ estado: "nuevo,preparando,listo,cobrado" }), refetchInterval: 6000 } }
  );

  const [selectedMesaNum, setSelectedMesaNum] = useState<string | null>(null);
  const [personasCount, setPersonasCount] = useState(2);
  const [mesaAcciones, setMesaAcciones] = useState<{ numero: string; estado: string; personas: number } | null>(null);
  const [cobrarPedido, setCobrarPedido] = useState<{ id: number; mesa: string; total: number; items?: any[] } | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "libre" | "ocupada" | "lista_cobro" | "en_pago">("todas");
  const [liberandoMesa, setLiberandoMesa] = useState(false);
  const [solicitandoCuenta, setSolicitandoCuenta] = useState(false);

  const libres = mesas?.filter((m) => m.estado === "libre").length ?? 0;
  const ocupadas = mesas?.filter((m) => m.estado === "ocupada").length ?? 0;
  const listaCobro = mesas?.filter((m) => m.estado === "lista_cobro").length ?? 0;
  const enPago = mesas?.filter((m) => m.estado === "en_pago").length ?? 0;
  const total = mesas?.length ?? 0;

  const pedidoActivoParaMesa = (n: string) => pedidos?.find((p) => p.mesa === n && p.estado !== "cobrado") ?? null;
  const pedidoCobradoParaMesa = (n: string) => pedidos?.find((p) => p.mesa === n && p.estado === "cobrado") ?? null;
  const pedidoParaMesa = (n: string) => pedidos?.find((p) => p.mesa === n && p.estado !== "cobrado") ?? null;

  const mesasFiltradas = mesas?.filter((m) =>
    filtro === "todas" ? true : m.estado === filtro
  );

  const handleMesaClick = (mesa: any) => {
    if (mesa.estado === "libre" || mesa.estado === "finalizada") {
      setPersonasCount(2);
      setSelectedMesaNum(mesa.numero);
    } else {
      setMesaAcciones({ numero: mesa.numero, estado: mesa.estado, personas: mesa.personas ?? 1 });
    }
  };

  const handleSolicitarCuenta = async (mesaNum: string) => {
    setSolicitandoCuenta(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const r = await fetch(`${base}/api/mesas/${encodeURIComponent(mesaNum)}/solicitar-cuenta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Error al solicitar cuenta");
      }
      queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
      setMesaAcciones(null);
      toast({ title: "Cuenta solicitada", description: `Mesa ${mesaNum} lista para cobro` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "No se pudo solicitar la cuenta", variant: "destructive" });
    } finally {
      setSolicitandoCuenta(false);
    }
  };

  const handleConfirmPersonas = () => {
    if (selectedMesaNum) {
      sessionStorage.setItem("mesaActual", String(selectedMesaNum));
      sessionStorage.setItem("personasActual", String(personasCount));
      setSelectedMesaNum(null);
      setLocation("/pedido");
    }
  };

  const handleNuevoPedido = (mesaNum: string, personas: number) => {
    sessionStorage.setItem("mesaActual", String(mesaNum));
    sessionStorage.setItem("personasActual", String(personas));
    sessionStorage.removeItem("pedidoActualId");
    sessionStorage.removeItem("pedidoActualItems");
    setMesaAcciones(null);
    setLocation("/pedido");
  };

  const handleAgregarAPedido = (mesaNum: string) => {
    const pedido = pedidoParaMesa(mesaNum);
    if (!pedido) return;
    sessionStorage.setItem("mesaActual", String(mesaNum));
    sessionStorage.setItem("pedidoActualId", String(pedido.id));
    sessionStorage.setItem("pedidoActualItems", JSON.stringify(pedido.items));
    setMesaAcciones(null);
    setLocation("/pedido");
  };

  const handleCobrar = (mesaNum: string) => {
    const pedido = pedidoParaMesa(mesaNum);
    if (!pedido) return;
    setMesaAcciones(null);
    setCobrarPedido({
      id: pedido.id,
      mesa: pedido.mesa,
      total: pedido.total,
      items: pedido.items,
    });
  };

  const handleCerrarMesa = async (mesaNum: string, propina: number) => {
    setLiberandoMesa(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const r = await fetch(`${base}/api/mesas/${encodeURIComponent(mesaNum)}/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(propina > 0 ? { propina } : {}),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Error al cerrar mesa");
      }
      queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
      setMesaAcciones(null);
      toast({
        title: `Mesa ${mesaNum} cerrada`,
        description: propina > 0 ? `Propina de ${formatPrice(propina)} registrada` : "La mesa quedó libre",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "No se pudo cerrar la mesa", variant: "destructive" });
    } finally {
      setLiberandoMesa(false);
    }
  };

  const FILTROS = [
    { key: "todas", label: "Todas", count: total, color: "rgba(255,255,255,0.7)" },
    { key: "libre", label: "Libres", count: libres, color: "#22c55e" },
    { key: "ocupada", label: "Ocupadas", count: ocupadas, color: "#f59e0b" },
    { key: "lista_cobro", label: "Lista Cobro", count: listaCobro, color: "#a855f7" },
    { key: "en_pago", label: "En Pago", count: enPago, color: "#6366f1" },
  ] as const;

  const ocupacionPct = total ? Math.round(((ocupadas + listaCobro + enPago) / total) * 100) : 0;

  return (
    <div className="relative flex flex-col min-h-[100dvh] text-white pb-20 md:pb-0">
      <PremiumBackground />
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <Navigation />

        <main className="flex-1 px-4 md:px-8 pt-5 md:pt-6 max-w-screen-2xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,45,45,0.1)", border: "1.5px solid rgba(255,45,45,0.2)" }}
                >
                  <LayoutGrid className="w-5 h-5 text-red-400" />
                </div>
                Mapa de Mesas
              </h1>
              <p className="text-zinc-600 text-xs mt-1 font-medium ml-0.5">
                {total} mesas ·{" "}
                <span className="text-emerald-500 font-semibold">{libres} libres</span>
                {" · "}
                <span className="text-amber-500 font-semibold">{ocupadas + listaCobro + enPago} ocupadas</span>
              </p>
            </div>

            {/* Occupancy bar */}
            <div className="hidden md:flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500 font-bold">{ocupacionPct}% ocupado</span>
              </div>
              <div className="w-36 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${ocupacionPct}%`,
                    background: ocupacionPct > 70
                      ? "linear-gradient(90deg,#f59e0b,#FF2D2D)"
                      : ocupacionPct > 40
                      ? "linear-gradient(90deg,#22c55e,#f59e0b)"
                      : "linear-gradient(90deg,#22c55e,#34d399)",
                    boxShadow: `0 0 12px rgba(255,45,45,${ocupacionPct / 200})`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {FILTROS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border"
                style={
                  filtro === f.key
                    ? {
                        background: `${f.color}14`,
                        borderColor: `${f.color}40`,
                        color: f.color,
                        boxShadow: `0 0 12px ${f.color}15`,
                        transform: "scale(1.02)",
                      }
                    : {
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.06)",
                        color: "#52525b",
                      }
                }
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                {f.label}
                <span className="font-mono opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl shimmer" />
              ))}
            </div>
          ) : mesasFiltradas?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-12 h-12 text-zinc-800 mb-3" />
              <p className="text-zinc-600 font-semibold">Sin mesas en este filtro</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger-grid">
              {mesasFiltradas?.map((mesa, idx) => (
                <MesaCard
                  key={mesa.numero}
                  mesa={mesa}
                  pedido={pedidoParaMesa(mesa.numero)}
                  onClick={() => handleMesaClick(mesa)}
                  index={idx}
                />
              ))}
            </div>
          )}
        </main>

        {/* Personas dialog */}
        <Dialog open={selectedMesaNum !== null} onOpenChange={(open) => !open && setSelectedMesaNum(null)}>
          <DialogContent className="sm:max-w-sm glass-modal border-white/8 text-white rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Users className="w-4 h-4 text-red-400" />
                </div>
                Mesa {selectedMesaNum} — Personas
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <p className="text-zinc-500 text-sm mb-7">¿Cuántas personas van a la mesa?</p>
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-14 h-14 rounded-2xl border-white/10 hover:bg-white/5 text-white"
                  onClick={() => setPersonasCount(Math.max(1, personasCount - 1))}
                >
                  <Minus className="w-6 h-6" />
                </Button>
                <div className="text-center">
                  <div
                    className="text-7xl font-black font-mono tabular-nums text-white leading-none"
                    style={{ textShadow: "0 0 30px rgba(255,45,45,0.2)" }}
                  >
                    {personasCount}
                  </div>
                  <div className="text-xs text-zinc-600 mt-1 font-medium">personas</div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-14 h-14 rounded-2xl border-white/10 hover:bg-white/5 text-red-400"
                  onClick={() => setPersonasCount(personasCount + 1)}
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setSelectedMesaNum(null)} className="text-zinc-500 hover:text-white">
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmPersonas}
                className="font-black px-8 h-11 rounded-xl ripple-btn"
                style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)", boxShadow: "0 8px 24px rgba(255,45,45,0.35)" }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Tomar Pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Acciones dialog */}
        <Dialog open={mesaAcciones !== null} onOpenChange={(open) => { if (!open) setMesaAcciones(null); }}>
          <DialogContent className="sm:max-w-sm glass-modal border-white/8 text-white p-0 overflow-hidden rounded-3xl">
            <div className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="text-xl font-black text-white">Mesa {mesaAcciones?.numero}</div>
                  {(() => {
                    const pedido = mesaAcciones ? pedidoParaMesa(mesaAcciones.numero) : null;
                    return pedido ? (
                      <div className="text-xs text-zinc-500">
                        {pedido.items?.length ?? 0} ítems ·{" "}
                        <span className="font-bold" style={{ color: "#FF2D2D" }}>{formatPrice(pedido.total)}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">{mesaAcciones?.personas ?? 0} personas</div>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-5 space-y-2.5">
              {mesaAcciones?.estado === "en_pago" ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-300 bg-indigo-500/8 border border-indigo-500/20">
                    <Receipt className="w-4 h-4 shrink-0" />
                    Mesa en pago — propina pendiente
                  </div>
                  {mesaAcciones && (() => {
                    const pc = pedidoCobradoParaMesa(mesaAcciones.numero);
                    return pc ? (
                      <Button
                        onClick={() => window.open(`/api/pedidos/${pc.id}/factura`, "_blank")}
                        className="w-full h-12 font-bold border-white/10 bg-white/5 hover:bg-white/8 text-white gap-2 rounded-xl"
                        variant="outline"
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir Factura
                      </Button>
                    ) : null;
                  })()}
                  <Button
                    onClick={() => mesaAcciones && handleCerrarMesa(mesaAcciones.numero, 0)}
                    disabled={liberandoMesa}
                    className="w-full h-12 font-black text-base gap-2 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)",
                      boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                    }}
                  >
                    <DoorOpen className="w-4 h-4" />
                    {liberandoMesa ? "Cerrando..." : "Cerrar Mesa y Liberar"}
                  </Button>
                </>
              ) : mesaAcciones?.estado === "lista_cobro" ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-300 bg-purple-500/8 border border-purple-500/20">
                    <Receipt className="w-4 h-4 shrink-0" />
                    Cliente solicitó la cuenta — lista para cobrar
                  </div>
                  {mesaAcciones && (() => {
                    const p = pedidoParaMesa(mesaAcciones.numero);
                    return p ? (
                      <Button
                        onClick={() => mesaAcciones && handleCobrar(mesaAcciones.numero)}
                        className="w-full h-12 font-black text-base gap-2 rounded-xl ripple-btn"
                        style={{
                          background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)",
                          boxShadow: "0 8px 24px rgba(255,45,45,0.35)",
                        }}
                      >
                        <Banknote className="w-4 h-4" />
                        Cobrar Mesa
                      </Button>
                    ) : null;
                  })()}
                </>
              ) : (
                <>
                  <Button
                    onClick={() => mesaAcciones && handleAgregarAPedido(mesaAcciones.numero)}
                    className="w-full h-12 font-bold border-white/10 bg-white/5 hover:bg-white/8 text-white gap-2 rounded-xl"
                    variant="outline"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {mesaAcciones && pedidoParaMesa(mesaAcciones.numero)
                      ? "Agregar / Modificar Pedido"
                      : "Ver / Agregar al Pedido"}
                  </Button>
                  {mesaAcciones && pedidoParaMesa(mesaAcciones.numero) && (
                    <>
                      <Button
                        onClick={() => mesaAcciones && handleSolicitarCuenta(mesaAcciones.numero)}
                        disabled={solicitandoCuenta}
                        className="w-full h-12 font-bold border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/15 text-purple-300 gap-2 rounded-xl"
                        variant="outline"
                      >
                        <Receipt className="w-4 h-4" />
                        {solicitandoCuenta ? "Solicitando..." : "Solicitar Cuenta"}
                      </Button>
                      <Button
                        onClick={() => mesaAcciones && handleCobrar(mesaAcciones.numero)}
                        className="w-full h-12 font-black text-base gap-2 rounded-xl ripple-btn"
                        style={{
                          background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)",
                          boxShadow: "0 8px 24px rgba(255,45,45,0.35)",
                        }}
                      >
                        <Banknote className="w-4 h-4" />
                        Cobrar Mesa
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <CobrarModal
          pedido={cobrarPedido}
          open={cobrarPedido !== null}
          onClose={() => setCobrarPedido(null)}
        />
      </div>
    </div>
  );
}
