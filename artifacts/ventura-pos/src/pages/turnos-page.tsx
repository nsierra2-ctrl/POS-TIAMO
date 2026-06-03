import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { playPedidoListo } from "@/lib/sounds";

type DisplayPedido = { id: number; mesa: string; estado: string; creadoEn: string };

function useDisplayPedidos() {
  return useQuery<DisplayPedido[]>({
    queryKey: ["display-pedidos"],
    queryFn: async () => {
      const res = await fetch("/api/display/pedidos");
      if (!res.ok) throw new Error("Error al cargar pedidos");
      return res.json();
    },
    refetchInterval: 3000,
    retry: false,
  });
}

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);
  return <span>{time}</span>;
}

export default function TurnosPage() {
  const { data: pedidos } = useDisplayPedidos();

  const prevListosRef = useRef<number[]>([]);

  const activos = pedidos?.filter((p) => p.estado !== "listo") || [];
  const listos = pedidos?.filter((p) => p.estado === "listo") || [];
  const nuevos = activos.filter((p) => p.estado === "nuevo");
  const preparando = activos.filter((p) => p.estado === "preparando");

  useEffect(() => {
    const prevIds = prevListosRef.current;
    const currentIds = listos.map((p) => p.id);
    const hayNuevosListos = currentIds.some((id) => !prevIds.includes(id));
    if (hayNuevosListos && prevIds.length > 0) {
      playPedidoListo();
    }
    prevListosRef.current = currentIds;
  }, [listos]);

  const turno = (id: number) => `#${id.toString().padStart(4, "0")}`;

  return (
    <div
      className="min-h-screen text-white flex flex-col select-none"
      style={{ background: "#08080a", fontFamily: "'Inter', monospace" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: "#1a1a1a", background: "#0d0d0f" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl"
            style={{ background: "#FF2D2D" }}
          >
            V
          </div>
          <div>
            <div className="font-black text-xl tracking-widest text-white">VENTURA'S PIZZA</div>
            <div className="text-xs font-bold tracking-widest" style={{ color: "#555" }}>
              SISTEMA DE TURNOS
            </div>
          </div>
        </div>
        <div className="font-mono font-black text-3xl tracking-wider" style={{ color: "#FF2D2D" }}>
          <Clock />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-0 overflow-hidden">

        {/* LISTOS — Highlighted hero section */}
        <div className="flex-1 p-6 border-b" style={{ borderColor: "#1a1a1a" }}>
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ background: "#22c55e" }}
            />
            <span className="font-black text-sm tracking-widest uppercase" style={{ color: "#22c55e" }}>
              Listos para recoger
            </span>
            <span
              className="font-mono font-black text-xs px-2 py-0.5 rounded"
              style={{ background: "#22c55e22", color: "#22c55e" }}
            >
              {listos.length}
            </span>
          </div>

          {listos.length === 0 ? (
            <div
              className="flex items-center justify-center h-24 rounded-2xl border-2 border-dashed text-sm font-bold tracking-widest"
              style={{ borderColor: "#1a1a1a", color: "#333" }}
            >
              SIN PEDIDOS LISTOS
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {[...listos]
                .sort((a, b) => a.id - b.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col items-center justify-center rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
                    style={{
                      background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
                      border: "2px solid #22c55e40",
                      minWidth: 140,
                      padding: "20px 28px",
                    }}
                  >
                    <span className="text-xs font-black tracking-widest" style={{ color: "#86efac" }}>
                      TURNO
                    </span>
                    <span className="font-black font-mono leading-none" style={{ fontSize: 56, color: "#fff" }}>
                      {turno(p.id)}
                    </span>
                    <span className="text-xs font-bold" style={{ color: "#86efac" }}>
                      MESA {p.mesa}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* EN PREPARACION */}
        <div className="flex-1 p-6 border-b" style={{ borderColor: "#1a1a1a" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 rounded-full" style={{ background: "#3b82f6" }} />
            <span className="font-black text-sm tracking-widest uppercase" style={{ color: "#3b82f6" }}>
              En preparación
            </span>
            <span
              className="font-mono font-black text-xs px-2 py-0.5 rounded"
              style={{ background: "#3b82f622", color: "#3b82f6" }}
            >
              {preparando.length}
            </span>
          </div>

          {preparando.length === 0 ? (
            <div
              className="flex items-center justify-center h-16 rounded-xl border-2 border-dashed text-xs font-bold tracking-widest"
              style={{ borderColor: "#1a1a1a", color: "#333" }}
            >
              NINGUNO EN PREPARACIÓN
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {[...preparando]
                .sort((a, b) => a.id - b.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col items-center justify-center rounded-xl"
                    style={{
                      background: "#1e2a3a",
                      border: "1.5px solid #3b82f630",
                      minWidth: 110,
                      padding: "14px 20px",
                    }}
                  >
                    <span className="text-[10px] font-black tracking-widest" style={{ color: "#60a5fa" }}>
                      TURNO
                    </span>
                    <span className="font-black font-mono" style={{ fontSize: 36, color: "#93c5fd" }}>
                      {turno(p.id)}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: "#60a5fa" }}>
                      MESA {p.mesa}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* EN ESPERA */}
        <div className="flex-none p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
            <span className="font-black text-sm tracking-widest uppercase" style={{ color: "#f59e0b" }}>
              En espera
            </span>
            <span
              className="font-mono font-black text-xs px-2 py-0.5 rounded"
              style={{ background: "#f59e0b22", color: "#f59e0b" }}
            >
              {nuevos.length}
            </span>
          </div>

          {nuevos.length === 0 ? (
            <div
              className="flex items-center justify-center h-12 rounded-lg border-2 border-dashed text-xs font-bold tracking-widest"
              style={{ borderColor: "#1a1a1a", color: "#333" }}
            >
              SIN PEDIDOS EN ESPERA
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...nuevos]
                .sort((a, b) => a.id - b.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg px-4 py-2"
                    style={{
                      background: "#1a1a0a",
                      border: "1px solid #f59e0b30",
                    }}
                  >
                    <span className="font-black font-mono text-lg" style={{ color: "#fbbf24" }}>
                      {turno(p.id)}
                    </span>
                    <span className="text-xs font-bold" style={{ color: "#78716c" }}>
                      M{p.mesa}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-8 py-3 flex justify-between items-center"
        style={{ borderTop: "1px solid #1a1a1a", background: "#0d0d0f" }}
      >
        <span className="text-xs font-bold tracking-widest" style={{ color: "#333" }}>
          VENTURA OS v2.0 — Actualización automática cada 3 segundos
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold" style={{ color: "#333" }}>
            EN VIVO
          </span>
        </div>
      </div>
    </div>
  );
}
