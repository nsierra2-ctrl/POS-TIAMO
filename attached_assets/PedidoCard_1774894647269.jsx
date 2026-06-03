// src/components/PedidoCard.jsx
"use client";
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const estadoConfig = {
  nuevo: {
    border: "border-amber-400",
    bg: "bg-amber-400/5",
    badge: "bg-amber-400 text-black",
    label: "NUEVO",
    glow: "shadow-amber-400/20",
    ring: "ring-amber-400/30",
  },
  preparando: {
    border: "border-blue-400",
    bg: "bg-blue-400/5",
    badge: "bg-blue-400 text-white",
    label: "PREPARANDO",
    glow: "shadow-blue-400/20",
    ring: "ring-blue-400/30",
  },
  listo: {
    border: "border-emerald-400",
    bg: "bg-emerald-400/5",
    badge: "bg-emerald-400 text-black",
    label: "LISTO ✓",
    glow: "shadow-emerald-400/20",
    ring: "ring-emerald-400/30",
  },
};

function useTimer(createdAt) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    const start = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isLate = elapsed > 600; // 10 min
  const isWarning = elapsed > 300; // 5 min

  return {
    display: `${mins}:${String(secs).padStart(2, "0")}`,
    isLate,
    isWarning,
    elapsed,
  };
}

export default function PedidoCard({ pedido, isNew }) {
  const cfg = estadoConfig[pedido.estado] || estadoConfig.nuevo;
  const timer = useTimer(pedido.createdAt);
  const [updating, setUpdating] = useState(false);

  const pedidoNum = String(pedido.id).slice(-3).toUpperCase();

  const updateEstado = async (nuevoEstado) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "pedidos", pedido.id), { estado: nuevoEstado });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={`
        relative rounded-2xl border-2 p-4 flex flex-col gap-3
        ${cfg.border} ${cfg.bg}
        shadow-xl ${cfg.glow}
        ring-1 ${cfg.ring}
        transition-all duration-500
        ${isNew ? "animate-pulse-once" : ""}
        ${pedido.estado === "listo" ? "opacity-60" : "opacity-100"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-xl">#{pedidoNum}</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Mesa</span>
          <p className="text-white font-black text-lg leading-none">{pedido.mesa}</p>
        </div>
      </div>

      {/* Timer */}
      <div className={`
        flex items-center gap-1.5 text-sm font-black font-mono
        ${timer.isLate ? "text-red-400 animate-pulse" : timer.isWarning ? "text-amber-400" : "text-white/50"}
      `}>
        <span>⏱</span>
        <span>{timer.display}</span>
        {timer.isLate && <span className="text-xs font-bold ml-1">¡URGENTE!</span>}
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {pedido.items?.map((item, i) => (
          <li key={i} className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="text-white/30 font-normal">×{item.cantidad}</span>
              {item.emoji} {item.nombre}
            </span>
          </li>
        ))}
      </ul>

      {/* Actions */}
      {pedido.estado !== "listo" && (
        <div className="flex gap-2 mt-1">
          {pedido.estado === "nuevo" && (
            <button
              onClick={() => updateEstado("preparando")}
              disabled={updating}
              className="flex-1 bg-blue-500 hover:bg-blue-400 active:scale-95 text-white font-black text-sm py-3 rounded-xl transition-all disabled:opacity-50"
            >
              🔥 INICIAR
            </button>
          )}
          {pedido.estado === "preparando" && (
            <button
              onClick={() => updateEstado("listo")}
              disabled={updating}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black text-sm py-3 rounded-xl transition-all disabled:opacity-50"
            >
              ✅ LISTO
            </button>
          )}
        </div>
      )}
    </div>
  );
}
