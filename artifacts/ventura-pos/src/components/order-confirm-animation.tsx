import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface OrderConfirmAnimationProps {
  open: boolean;
  message?: string;
  submessage?: string;
  onComplete?: () => void;
  durationMs?: number;
}

export function OrderConfirmAnimation({
  open,
  message = "¡Pedido Confirmado!",
  submessage = "Enviado a cocina",
  onComplete,
  durationMs = 2200,
}: OrderConfirmAnimationProps) {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; rot: number; color: string; size: number; delay: number }[]
  >([]);

  useEffect(() => {
    if (!open) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      const colors = ["#FF2D2D", "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#ffffff"];
      const arr = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50,
        rot: Math.random() * 720 - 360,
        color: colors[i % colors.length]!,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 0.3,
      }));
      setParticles(arr);
    } else {
      setParticles([]);
    }
    const t = setTimeout(() => onComplete?.(), durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onComplete]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
    >
      {/* Confetti particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.id % 3 === 0 ? "50%" : "2px",
            boxShadow: `0 0 12px ${p.color}`,
            animation: `confetti-burst 1.4s cubic-bezier(0.16,1,0.3,1) ${p.delay}s forwards`,
            ["--rot" as any]: `${p.rot}deg`,
            ["--dx" as any]: `${(Math.random() - 0.5) * 600}px`,
            ["--dy" as any]: `${-Math.random() * 500 - 100}px`,
          }}
        />
      ))}

      {/* Center checkmark card */}
      <div
        className="relative flex flex-col items-center gap-4 px-12 py-10 rounded-3xl"
        style={{
          background: "linear-gradient(160deg,rgba(24,24,28,0.98),rgba(15,15,18,0.98))",
          border: "1.5px solid rgba(34,197,94,0.4)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 80px rgba(34,197,94,0.3)",
          animation: "confirm-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Pulsing ring */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            border: "2px solid rgba(34,197,94,0.5)",
            animation: "confirm-ring 1.5s ease-out infinite",
          }}
        />
        {/* Checkmark icon */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#22c55e,#15803d)",
            boxShadow: "0 12px 40px rgba(34,197,94,0.5), inset 0 2px 0 rgba(255,255,255,0.3)",
            animation: "check-bounce 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          }}
        >
          <CheckCircle2
            className="w-14 h-14 text-white"
            strokeWidth={2.5}
            style={{ animation: "check-draw 0.5s ease-out 0.4s both" }}
          />
          <Sparkles
            className="absolute -top-2 -right-2 w-6 h-6 text-amber-300"
            style={{ animation: "spark-spin 2s ease-in-out infinite" }}
          />
        </div>
        <div className="text-center">
          <h2
            className="text-3xl font-black text-white mb-1"
            style={{ animation: "text-rise 0.5s ease-out 0.3s both" }}
          >
            {message}
          </h2>
          <p
            className="text-emerald-400 text-sm font-semibold"
            style={{ animation: "text-rise 0.5s ease-out 0.4s both" }}
          >
            {submessage}
          </p>
        </div>
      </div>
    </div>
  );
}
