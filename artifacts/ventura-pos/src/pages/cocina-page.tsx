import { useCallback, useEffect, useRef, useState } from "react";
import { Navigation } from "@/components/navigation";
import { PremiumBackground } from "@/components/premium-background";
import { useGetPedidos, getGetPedidosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, ChefHat, CheckCircle2, Maximize2, Minimize2, Volume2, VolumeX,
  AlertTriangle, Flame, Coffee, UtensilsCrossed, Printer,
  Trash2, Minus, Plus, X, Pencil, Ban, Save
} from "lucide-react";
import { playNuevoPedido } from "@/lib/sounds";
import { formatPrice } from "@/lib/constants";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function Timer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState({ mins: 0, secs: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Date.now() - new Date(createdAt).getTime();
      setElapsed({ mins: Math.floor(diff / 60000), secs: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [createdAt]);

  const level = elapsed.mins >= 10 ? 2 : elapsed.mins >= 5 ? 1 : 0;
  const configs = [
    { bg: "bg-emerald-950/60", border: "border-emerald-500/20", text: "text-emerald-300", dot: "bg-emerald-400" },
    { bg: "bg-amber-950/60", border: "border-amber-500/30", text: "text-amber-300", dot: "bg-amber-400" },
    { bg: "bg-red-950/60", border: "border-red-500/40", text: "text-red-300 animate-pulse", dot: "bg-red-400 animate-ping" },
  ];
  const c = configs[level];
  return (
    <div className={`flex items-center gap-2 font-mono font-black text-sm px-3 py-1.5 rounded-xl border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {elapsed.mins.toString().padStart(2, "0")}:{elapsed.secs.toString().padStart(2, "0")}
    </div>
  );
}

const ESTADO_STYLE: Record<string, { border: string; headerBg: string; badge: string; badgeText: string; accentColor: string }> = {
  nuevo: {
    border: "border-amber-500/30 shadow-[0_0_0_1px_rgba(245,158,11,0.06)]",
    headerBg: "from-amber-950/80 to-amber-950/10",
    badge: "bg-amber-500/15 border-amber-500/25 text-amber-300",
    badgeText: "TICKET RECIBIDO",
    accentColor: "rgba(245,158,11,0.15)",
  },
  preparando: {
    border: "border-blue-500/25 shadow-[0_0_0_1px_rgba(59,130,246,0.06)]",
    headerBg: "from-blue-950/80 to-blue-950/10",
    badge: "bg-blue-500/15 border-blue-500/25 text-blue-300",
    badgeText: "EN PREPARACIÓN",
    accentColor: "rgba(59,130,246,0.15)",
  },
  listo: {
    border: "border-emerald-500/30 shadow-[0_0_0_1px_rgba(34,197,94,0.06)]",
    headerBg: "from-emerald-950/80 to-emerald-950/10",
    badge: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
    badgeText: "LISTO",
    accentColor: "rgba(34,197,94,0.1)",
  },
  modificado: {
    border: "border-purple-500/30 shadow-[0_0_0_1px_rgba(168,85,247,0.06)]",
    headerBg: "from-purple-950/80 to-purple-950/10",
    badge: "bg-purple-500/15 border-purple-500/25 text-purple-300",
    badgeText: "MODIFICADO",
    accentColor: "rgba(168,85,247,0.15)",
  },
};

interface TicketCardProps {
  pedido: any;
  isNew: boolean;
  onActualizar: () => void;
}

function TicketCard({ pedido, isNew, onActualizar }: TicketCardProps) {
  const style = ESTADO_STYLE[pedido.estado] ?? ESTADO_STYLE.nuevo;
  const items = Array.isArray(pedido.items) ? pedido.items : [];
  const totalItems = items.reduce((s: number, i: any) => s + i.cantidad, 0);
  const tieneObs = items.some((i: any) => i.observaciones);
  const isListo = pedido.estado === "listo";

  const [editando, setEditando] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [guardando, setGuardando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editando) setEditItems([...items]);
  }, [editando, items]);

  const cambiarCantidad = (idx: number, delta: number) => {
    setEditItems((prev) => {
      const next = [...prev];
      const nuevaCantidad = (next[idx].cantidad || 1) + delta;
      if (nuevaCantidad <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], cantidad: nuevaCantidad };
      }
      return next;
    });
  };

  const eliminarItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const guardarCambios = async () => {
    if (editItems.length === 0) {
      toast({ title: "No hay items", description: "Agrega al menos un producto o cancela el pedido", variant: "destructive" });
      return;
    }
    setGuardando(true);
    try {
      const total = editItems.reduce((s: number, it: any) => s + (it.precio || 0) * (it.cantidad || 1), 0);
      const r = await fetch(`${BASE}/api/pedidos/${pedido.id}/items`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editItems.map((it: any) => ({
            id: it.id || `${pedido.id}-${it.nombre}`,
            nombre: it.nombre,
            emoji: it.emoji || "",
            precio: it.precio,
            cantidad: it.cantidad,
            observaciones: it.observaciones,
          })),
          total,
          nota: `Modificado desde cocina · ${new Date().toLocaleTimeString("es-CO")}`,
        }),
      });
      if (!r.ok) throw new Error("Error al guardar cambios");
      toast({ title: "Pedido actualizado", description: "Se reimprimó la comanda" });
      setEditando(false);
      onActualizar();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "No se pudo guardar", variant: "destructive" });
    } finally {
      setGuardando(false);
    }
  };

  const cancelarPedido = async () => {
    if (!confirm(`¿Cancelar completamente el pedido de Mesa ${pedido.mesa}? Esta acción no se puede deshacer.`)) return;
    try {
      const r = await fetch(`${BASE}/api/pedidos/${pedido.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Error al cancelar");
      toast({ title: "Pedido cancelado", description: `Mesa ${pedido.mesa} liberada` });
      onActualizar();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "No se pudo cancelar", variant: "destructive" });
    }
  };

  const marcarListo = async () => {
    try {
      const r = await fetch(`${BASE}/api/pedidos/${pedido.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "listo" }),
      });
      if (!r.ok) throw new Error("Error al marcar como listo");
      onActualizar();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "No se pudo actualizar", variant: "destructive" });
    }
  };

  const marcarPreparando = async () => {
    try {
      const r = await fetch(`${BASE}/api/pedidos/${pedido.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "preparando" }),
      });
      if (!r.ok) throw new Error("Error al actualizar");
      onActualizar();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "No se pudo actualizar", variant: "destructive" });
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border overflow-hidden transition-all duration-500 mesa-card-enter ${style.border} ${isNew ? "ring-2 ring-amber-400/30" : ""}`}
      style={{
        background: "linear-gradient(180deg,rgba(12,12,14,0.97) 0%,rgba(8,8,10,0.99) 100%)",
        boxShadow: isNew ? `0 0 30px ${style.accentColor}` : undefined,
      }}
    >
      {/* Header */}
      <div className={`px-4 py-3 bg-gradient-to-b ${style.headerBg} flex items-center justify-between gap-3 border-b border-white/5`}>
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0 font-black font-mono text-white text-lg">
            {pedido.mesa}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Mesa</span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${style.badge}`}>
                {style.badgeText}
              </span>
              {isNew && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-400/40 bg-amber-400/10 text-amber-300 animate-pulse">
                  NUEVO
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-600">
              {totalItems} ítem{totalItems !== 1 ? "s" : ""}
              {tieneObs && <span className="text-amber-500/70 ml-1">· con obs.</span>}
            </div>
          </div>
        </div>
        <Timer createdAt={pedido.creadoEn} />
      </div>

      {/* Order ID + time */}
      <div className="px-4 py-1.5 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-700 tracking-widest">#{String(pedido.id).padStart(5, "0")}</span>
        <div className="flex items-center gap-2">
          {!isListo && !editando && (
            <button
              onClick={() => setEditando(true)}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <Pencil size={10} /> Editar
            </button>
          )}
          {editando && (
            <button onClick={() => setEditando(false)} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
              <X size={10} /> Cancelar
            </button>
          )}
          <span className="text-[10px] text-zinc-700 font-mono">
            {new Date(pedido.creadoEn).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="flex-1 divide-y divide-white/5">
        {(editando ? editItems : items).map((item: any, idx: number) => (
          <li key={idx} className={`px-4 py-3 ${editando ? "bg-white/[0.02]" : ""}`}>
            <div className="flex items-center gap-3">
              {editando ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => cambiarCantidad(idx, -1)}
                    className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="w-7 text-center text-sm font-black font-mono text-white">{item.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(idx, 1)}
                    className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-black font-mono"
                  style={{ background: "rgba(255,45,45,0.1)", color: "#FF2D2D", border: "1px solid rgba(255,45,45,0.2)" }}
                >
                  {item.cantidad > 1 ? `×${item.cantidad}` : "×1"}
                </div>
              )}
              <span className="flex-1 font-semibold text-sm text-white leading-tight">{item.nombre}</span>
              {editando && (
                <button
                  onClick={() => eliminarItem(idx)}
                  className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
            {item.observaciones && (
              <div
                className="mt-1.5 ml-11 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-start gap-1.5"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  borderLeft: "2px solid rgba(245,158,11,0.4)",
                  color: "rgba(253,230,138,0.85)",
                }}
              >
                <AlertTriangle size={10} className="mt-0.5 shrink-0 text-amber-500" />
                {item.observaciones}
              </div>
            )}
          </li>
        ))}
        {editando && editItems.length === 0 && (
          <li className="px-4 py-6 text-center text-zinc-600 text-xs">
            Todos los items fueron eliminados. Guarda para cancelar el pedido.
          </li>
        )}
      </ul>

      {/* Edit action bar */}
      {editando && (
        <div className="px-4 py-3 border-t border-white/5 space-y-2" style={{ background: "rgba(168,85,247,0.04)" }}>
          <button
            onClick={guardarCambios}
            disabled={guardando || editItems.length === 0}
            className="w-full h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "#fff" }}
          >
            {guardando ? <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={12} />}
            {guardando ? "Guardando..." : "Guardar Cambios y Reimprimir"}
          </button>
          <button
            onClick={cancelarPedido}
            className="w-full h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
          >
            <Ban size={12} /> Cancelar Pedido Completo
          </button>
        </div>
      )}

      {/* Notes */}
      {pedido.notas && !editando && (
        <div className="px-4 py-2.5 border-t border-white/5 flex items-start gap-2" style={{ background: "rgba(245,158,11,0.04)" }}>
          <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest shrink-0 mt-0.5">Nota</span>
          <p className="text-amber-300/70 text-xs font-medium">{pedido.notas}</p>
        </div>
      )}

      {/* Total */}
      <div className="px-4 py-2 border-t border-white/5 flex justify-between items-center">
        <span className="text-[10px] text-zinc-700 uppercase tracking-wider font-bold">Total pedido</span>
        <span className="text-sm font-black font-mono text-zinc-500">
          {formatPrice(editando ? editItems.reduce((s: number, it: any) => s + (it.precio || 0) * (it.cantidad || 1), 0) : pedido.total)}
        </span>
      </div>

      {/* Status strip + action buttons */}
      <div
        className="h-9 flex items-center justify-center gap-2 text-xs font-black tracking-wider border-t"
        style={{
          background: isListo ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
          borderColor: isListo ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
          color: isListo ? "rgba(34,197,94,0.7)" : "rgba(255,255,255,0.2)",
        }}
      >
        {isListo ? (
          <>
            <CheckCircle2 size={12} />
            LISTO PARA ENTREGAR
          </>
        ) : editando ? (
          <>
            <Pencil size={12} />
            MODO EDICIÓN
          </>
        ) : pedido.estado === "nuevo" ? (
          <button
            onClick={marcarPreparando}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <Flame size={12} /> INICIAR PREPARACIÓN
          </button>
        ) : (
          <button
            onClick={marcarListo}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <CheckCircle2 size={12} /> MARCAR LISTO
          </button>
        )}
      </div>
    </div>
  );
}

export default function CocinaPage() {
  const [currentTime, setCurrentTime] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [filterEstado, setFilterEstado] = useState<"todos" | "nuevo" | "preparando" | "listo">("todos");
  const prevNuevosRef = useRef<Set<number>>(new Set());
  const newIdsRef = useRef<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const [listosVisibles, setListosVisibles] = useState<Set<number>>(new Set());
  const listosTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const tick = () =>
      setCurrentTime(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const { data: pedidosAll, isLoading } = useGetPedidos(undefined, {
    query: { queryKey: getGetPedidosQueryKey(), refetchInterval: 3000 },
  });

  const activos = pedidosAll?.filter((p) => p.estado === "nuevo" || p.estado === "preparando") ?? [];
  const listos = pedidosAll?.filter((p) => p.estado === "listo") ?? [];

  const sortedActivos = [...activos].sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === "nuevo" ? -1 : 1;
    return new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
  });

  useEffect(() => {
    if (!pedidosAll) return;
    const nuevosIds = new Set(pedidosAll.filter((p) => p.estado === "nuevo").map((p) => p.id));
    if (audioEnabled) {
      const incoming = [...nuevosIds].filter((id) => !prevNuevosRef.current.has(id));
      if (incoming.length > 0 && prevNuevosRef.current.size > 0) {
        playNuevoPedido();
        incoming.forEach((id) => newIdsRef.current.add(id));
        setTimeout(() => incoming.forEach((id) => newIdsRef.current.delete(id)), 8000);
      }
    }
    prevNuevosRef.current = nuevosIds;
  }, [pedidosAll, audioEnabled]);

  useEffect(() => {
    const listosIds = new Set(listos.map((p) => p.id));
    listosIds.forEach((id) => {
      if (!listosTimers.current.has(id)) {
        setListosVisibles((prev) => new Set([...prev, id]));
        const timer = setTimeout(() => {
          setListosVisibles((prev) => { const next = new Set(prev); next.delete(id); return next; });
          listosTimers.current.delete(id);
        }, 30000);
        listosTimers.current.set(id, timer);
      }
    });
    listosTimers.current.forEach((timer, id) => {
      if (!listosIds.has(id)) { clearTimeout(timer); listosTimers.current.delete(id); }
    });
  }, [listos]);

  const listosParaMostrar = listos.filter((p) => listosVisibles.has(p.id));
  const nuevosCount = activos.filter((p) => p.estado === "nuevo").length;
  const prepCount = activos.filter((p) => p.estado === "preparando").length;
  const listosCount = listosParaMostrar.length;
  const retrasados = activos.filter((p) => (Date.now() - new Date(p.creadoEn).getTime()) / 60000 >= 10).length;

  const filteredActivos = filterEstado === "todos" ? sortedActivos
    : filterEstado === "listo" ? []
    : sortedActivos.filter((p) => p.estado === filterEstado);
  const filteredListos = filterEstado === "todos" || filterEstado === "listo" ? listosParaMostrar : [];
  const allPedidos = [...filteredActivos, ...filteredListos];

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {});
    }
  }, []);

  const actualizarPedidos = () => {
    queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
  };

  return (
    <div className="relative flex flex-col min-h-screen text-white pb-20 md:pb-0" style={{ background: "#060608" }}>
      <PremiumBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navigation />

        {/* KDS Header */}
        <div
          className="border-b border-white/5 py-2.5 px-4 md:px-6 flex items-center gap-3 sticky top-14 z-30"
          style={{ background: "rgba(6,6,8,0.95)", backdropFilter: "blur(20px)" }}
        >
          <ChefHat className="text-red-500 w-5 h-5 shrink-0" />
          <span className="text-xs font-black tracking-widest text-white/40 hidden sm:block">MONITOR DE COCINA</span>

          <div className="flex gap-2 ml-1 flex-wrap">
            {[
              { key: "todos", label: "Todos", count: activos.length + listosParaMostrar.length, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
              { key: "nuevo", label: "Nuevos", count: nuevosCount, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { key: "preparando", label: "Prep.", count: prepCount, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { key: "listo", label: "Listos", count: listosCount, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
            ].map(({ key, label, count, color }) => (
              <button
                key={key}
                onClick={() => setFilterEstado(key as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${color} ${filterEstado === key ? "ring-1 ring-white/20" : "opacity-60 hover:opacity-100"}`}
              >
                {label}
                {count > 0 && <span className="font-mono">{count}</span>}
              </button>
            ))}

            {retrasados > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                <Flame size={10} />
                {retrasados} RETRASADO{retrasados !== 1 ? "S" : ""}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black font-mono"
              style={{ background: "rgba(255,45,45,0.06)", border: "1px solid rgba(255,45,45,0.15)", color: "rgba(255,45,45,0.7)" }}
            >
              <Printer size={11} />
              <span className="text-zinc-500 font-mono">{currentTime}</span>
            </div>
            <button
              onClick={() => setAudioEnabled((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              title={audioEnabled ? "Silenciar" : "Activar sonido"}
            >
              {audioEnabled ? <Volume2 size={15} className="text-zinc-500" /> : <VolumeX size={15} className="text-red-500" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors hidden md:flex"
            >
              {fullscreen ? <Minimize2 size={15} className="text-zinc-500" /> : <Maximize2 size={15} className="text-zinc-500" />}
            </button>
          </div>
        </div>

        <main className="relative flex-1 p-3 md:p-4 w-full">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 rounded-2xl shimmer border border-white/5" />
              ))}
            </div>
          ) : allPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center mb-5">
                <UtensilsCrossed className="w-10 h-10 text-white/10" />
              </div>
              <h2 className="text-2xl font-black text-white/15 mb-2 tracking-widest">
                {filterEstado === "todos" ? "LÍNEA LIMPIA" : `SIN PEDIDOS ${filterEstado.toUpperCase()}`}
              </h2>
              <p className="text-white/10 font-medium text-sm">
                {filterEstado === "todos" ? "Esperando tickets de cocina..." : `No hay pedidos en estado "${filterEstado}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 stagger-grid">
              {allPedidos.map((pedido) => (
                <TicketCard
                  key={pedido.id}
                  pedido={pedido}
                  isNew={newIdsRef.current.has(pedido.id)}
                  onActualizar={actualizarPedidos}
                />
              ))}
            </div>
          )}
        </main>

        {activos.length > 0 && (
          <div
            className="hidden md:flex fixed bottom-0 left-0 right-0 h-10 border-t border-white/5 items-center justify-center gap-8 text-[10px] font-bold tracking-wider z-30"
            style={{ background: "rgba(6,6,8,0.98)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center gap-1.5 text-amber-400"><Coffee size={11} />{nuevosCount} ticket{nuevosCount !== 1 ? "s" : ""} nuevo{nuevosCount !== 1 ? "s" : ""}</div>
            <div className="flex items-center gap-1.5 text-blue-400"><Flame size={11} />{prepCount} en preparación</div>
            <div className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={11} />{listosCount} listo{listosCount !== 1 ? "s" : ""}</div>
            <div className="w-px h-4 bg-white/5" />
            <div className="text-zinc-600">{formatPrice(activos.reduce((s, p) => s + p.total, 0))} en preparación</div>
          </div>
        )}
      </div>
    </div>
  );
}
