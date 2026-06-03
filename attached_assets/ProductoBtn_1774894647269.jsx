// src/components/ProductoBtn.jsx
"use client";
import { useState } from "react";

export default function ProductoBtn({ producto, onAdd }) {
  const [bounce, setBounce] = useState(false);

  const handleClick = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 300);
    onAdd(producto);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-center gap-2
        rounded-2xl border border-white/10 bg-white/5
        w-full p-4 min-h-[100px]
        hover:bg-red-600/20 hover:border-red-500/50
        active:scale-95 transition-all duration-150
        group cursor-pointer select-none
        ${bounce ? "scale-110" : ""}
      `}
    >
      <span className="text-3xl">{producto.emoji}</span>
      <div className="text-center">
        <p className="text-white font-bold text-sm leading-tight">{producto.nombre}</p>
        <p className="text-red-400 font-black text-base mt-0.5">${producto.precio.toLocaleString()}</p>
      </div>
      {/* Add indicator */}
      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        +
      </span>
    </button>
  );
}
