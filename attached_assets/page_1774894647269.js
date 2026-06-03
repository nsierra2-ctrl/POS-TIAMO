// src/app/page.js
"use client";
import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MesaCard from "@/components/MesaCard";
import ProductoBtn from "@/components/ProductoBtn";

const MESAS = Array.from({ length: 10 }, (_, i) => ({
  numero: i + 1,
  estado: i === 2 ? "ocupada" : i === 5 ? "proceso" : "libre",
}));

const MENU = {
  Pizzas: [
    { id: "p1", nombre: "Pizza Personal", emoji: "🍕", precio: 18000, categoria: "Pizzas" },
    { id: "p2", nombre: "Pizza Mediana", emoji: "🍕", precio: 28000, categoria: "Pizzas" },
    { id: "p3", nombre: "Pizza Familiar", emoji: "🍕", precio: 42000, categoria: "Pizzas" },
    { id: "p4", nombre: "Calzone", emoji: "🥙", precio: 22000, categoria: "Pizzas" },
  ],
  Bebidas: [
    { id: "b1", nombre: "Gaseosa", emoji: "🥤", precio: 4000, categoria: "Bebidas" },
    { id: "b2", nombre: "Agua", emoji: "💧", precio: 2500, categoria: "Bebidas" },
    { id: "b3", nombre: "Jugo Natural", emoji: "🍊", precio: 6000, categoria: "Bebidas" },
    { id: "b4", nombre: "Cerveza", emoji: "🍺", precio: 7000, categoria: "Bebidas" },
  ],
  Extras: [
    { id: "e1", nombre: "Pan de Ajo", emoji: "🥖", precio: 5000, categoria: "Extras" },
    { id: "e2", nombre: "Alitas", emoji: "🍗", precio: 14000, categoria: "Extras" },
    { id: "e3", nombre: "Ensalada", emoji: "🥗", precio: 8000, categoria: "Extras" },
    { id: "e4", nombre: "Postre", emoji: "🍰", precio: 7000, categoria: "Extras" },
  ],
};

export default function MeseroPage() {
  const [vista, setVista] = useState("mesas"); // "mesas" | "pedido"
  const [mesaActiva, setMesaActiva] = useState(null);
  const [categoria, setCategoria] = useState("Pizzas");
  const [items, setItems] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const seleccionarMesa = (mesa) => {
    setMesaActiva(mesa);
    setItems([]);
    setVista("pedido");
  };

  const agregarItem = useCallback((producto) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === producto.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
        return copia;
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
    // Vibration feedback on mobile
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const deshacerUltimo = () => {
    setItems((prev) => {
      if (!prev.length) return prev;
      const copia = [...prev];
      const ultimo = copia[copia.length - 1];
      if (ultimo.cantidad > 1) {
        copia[copia.length - 1] = { ...ultimo, cantidad: ultimo.cantidad - 1 };
      } else {
        copia.pop();
      }
      return copia;
    });
  };

  const enviarPedido = async () => {
    if (!items.length || enviando) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, "pedidos"), {
        mesa: mesaActiva.numero,
        items: items.map(({ id, nombre, emoji, precio, cantidad }) => ({
          id, nombre, emoji, precio, cantidad,
        })),
        estado: "nuevo",
        total,
        createdAt: serverTimestamp(),
      });
      setExito(true);
      setTimeout(() => {
        setExito(false);
        setVista("mesas");
        setItems([]);
      }, 1500);
    } catch (e) {
      console.error(e);
      alert("Error al enviar pedido. Verifica la conexión.");
    } finally {
      setEnviando(false);
    }
  };

  if (vista === "mesas") {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm font-black">V</div>
            <div>
              <p className="text-white font-black text-base leading-none">VENTURA OS</p>
              <p className="text-white/30 text-xs">Sistema de Pedidos</p>
            </div>
          </div>
          <a href="/cocina" className="text-xs text-white/40 hover:text-white/70 transition border border-white/10 rounded-lg px-3 py-1.5">
            🍳 Cocina
          </a>
        </div>

        <div className="px-4 pt-5 pb-4">
          <h1 className="text-xl font-black text-white mb-1">Selecciona una mesa</h1>
          <p className="text-white/30 text-sm mb-5">Toca para iniciar un pedido</p>

          {/* Legend */}
          <div className="flex gap-4 mb-5">
            {[["bg-emerald-400", "Libre"], ["bg-amber-400", "Ocupada"], ["bg-red-400", "En proceso"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${c}`} />
                <span className="text-xs text-white/40">{l}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {MESAS.map((mesa) => (
              <MesaCard
                key={mesa.numero}
                numero={mesa.numero}
                estado={mesa.estado}
                onClick={() => seleccionarMesa(mesa)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PEDIDO VIEW
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      {/* Success overlay */}
      {exito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="text-center">
            <div className="text-6xl mb-3 animate-bounce">✅</div>
            <p className="text-white font-black text-2xl">¡Pedido enviado!</p>
            <p className="text-white/50 mt-1">La cocina ya lo recibió</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setVista("mesas")}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-lg transition"
        >
          ←
        </button>
        <div>
          <p className="text-white font-black text-base">Mesa {mesaActiva?.numero}</p>
          <p className="text-white/30 text-xs">{items.reduce((s, i) => s + i.cantidad, 0)} productos</p>
        </div>
        <div className="ml-auto">
          <p className="text-red-400 font-black text-lg">${total.toLocaleString()}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto scrollbar-none">
        {Object.keys(MENU).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoria(cat)}
            className={`
              px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all
              ${categoria === cat
                ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MENU[categoria].map((prod) => (
          <ProductoBtn key={prod.id} producto={prod} onAdd={agregarItem} />
        ))}
      </div>

      {/* Order summary */}
      {items.length > 0 && (
        <div className="px-4 pb-2">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold text-sm">Tu pedido</p>
              <button
                onClick={deshacerUltimo}
                className="text-xs text-white/40 hover:text-red-400 transition flex items-center gap-1"
              >
                ↩ Deshacer
              </button>
            </div>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span className="text-white/80 text-sm flex items-center gap-2">
                    <span className="text-white/30 font-mono">×{item.cantidad}</span>
                    {item.emoji} {item.nombre}
                  </span>
                  <span className="text-white/60 text-sm font-semibold">
                    ${(item.precio * item.cantidad).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Sticky send button */}
      <div className="sticky bottom-0 px-4 pb-6 pt-3 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent mt-auto">
        <button
          onClick={enviarPedido}
          disabled={!items.length || enviando}
          className={`
            w-full py-5 rounded-2xl font-black text-xl transition-all
            ${items.length
              ? "bg-red-600 hover:bg-red-500 active:scale-95 text-white shadow-xl shadow-red-500/30"
              : "bg-white/5 text-white/20 cursor-not-allowed"}
          `}
        >
          {enviando ? "Enviando..." : `ENVIAR PEDIDO · $${total.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
