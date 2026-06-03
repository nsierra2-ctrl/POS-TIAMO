// src/components/MesaCard.jsx
"use client";
import { useState } from "react";

const estadoConfig = {
  libre: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-500/20",
    label: "Libre",
    labelColor: "text-emerald-400",
  },
  ocupada: {
    bg: "bg-amber-500/10",
    border: "border-amber-400/40",
    dot: "bg-amber-400",
    glow: "shadow-amber-500/20",
    label: "Ocupada",
    labelColor: "text-amber-400",
  },
  proceso: {
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    dot: "bg-red-400",
    glow: "shadow-red-500/20",
    label: "En proceso",
    labelColor: "text-red-400",
  },
};

export default function MesaCard({ numero, estado = "libre", personas = 0, onClick }) {
  const [pressed, setPressed] = useState(false);
  const cfg = estadoConfig[estado] || estadoConfig.libre;

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl border-2 p-5 w-full aspect-square
        transition-all duration-150 cursor-pointer select-none
        ${cfg.bg} ${cfg.border}
        shadow-lg ${cfg.glow}
        ${pressed ? "scale-95 brightness-90" : "hover:scale-105 hover:brightness-110"}
        active:scale-95
      `}
      style={{ minHeight: 120 }}
    >
      {/* Glow pulse for occupied */}
      {estado !== "libre" && (
        <span className={`absolute inset-0 rounded-2xl animate-ping opacity-10 ${cfg.bg}`} />
      )}

      {/* Mesa icon */}
      <div className="text-4xl mb-1 select-none">🍕</div>

      {/* Number */}
      <span className="text-white font-black text-2xl tracking-tight">
        Mesa {numero}
      </span>

      {/* Status */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`w-2 h-2 rounded-full ${cfg.dot} ${estado !== "libre" ? "animate-pulse" : ""}`} />
        <span className={`text-xs font-semibold uppercase tracking-widest ${cfg.labelColor}`}>
          {cfg.label}
        </span>
      </div>

      {/* Personas */}
      {personas > 0 && (
        <span className="absolute top-2 right-3 text-xs text-white/50 font-medium">
          👤 {personas}
        </span>
      )}
    </button>
  );
}
