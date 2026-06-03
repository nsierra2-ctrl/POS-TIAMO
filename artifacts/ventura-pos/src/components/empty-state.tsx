import { ReactNode } from "react";

type Variant = "kitchen" | "tables" | "orders" | "cash" | "menu" | "users" | "search";

const ILLUSTRATIONS: Record<Variant, () => React.ReactElement> = {
  kitchen: () => (
    <svg viewBox="0 0 200 160" className="w-44 h-36">
      <defs>
        <linearGradient id="es-pan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <radialGradient id="es-fire">
          <stop offset="0" stopColor="#FF8A3D" />
          <stop offset="1" stopColor="#FF2D2D" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="135" rx="70" ry="6" fill="rgba(255,45,45,0.10)" />
      <rect x="40" y="105" width="120" height="14" rx="3" fill="url(#es-pan)" />
      <rect x="155" y="106" width="20" height="6" rx="2" fill="#3f3f46" />
      <ellipse cx="100" cy="100" rx="55" ry="10" fill="#27272a" />
      <g style={{ transformOrigin: "100px 90px", animation: "icon-float 3s ease-in-out infinite" }}>
        <ellipse cx="100" cy="50" rx="22" ry="14" fill="url(#es-fire)" opacity="0.7" />
        <ellipse cx="92" cy="62" rx="14" ry="9" fill="url(#es-fire)" opacity="0.55" />
        <ellipse cx="110" cy="60" rx="12" ry="8" fill="url(#es-fire)" opacity="0.5" />
      </g>
    </svg>
  ),
  tables: () => (
    <svg viewBox="0 0 200 160" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="6" fill="rgba(255,45,45,0.10)" />
      <circle cx="100" cy="80" r="48" fill="#1c1c20" stroke="rgba(255,45,45,0.35)" strokeWidth="2" />
      <circle cx="100" cy="80" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3 4" />
      <text x="100" y="89" textAnchor="middle" fontSize="28" fontWeight="900" fill="rgba(255,255,255,0.6)">
        ?
      </text>
    </svg>
  ),
  orders: () => (
    <svg viewBox="0 0 200 160" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="6" fill="rgba(255,45,45,0.10)" />
      <g style={{ animation: "icon-float 4s ease-in-out infinite" }}>
        <rect x="60" y="35" width="80" height="100" rx="6" fill="#1c1c20" stroke="rgba(255,45,45,0.3)" strokeWidth="1.5" />
        <line x1="72" y1="55" x2="128" y2="55" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <line x1="72" y1="70" x2="120" y2="70" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
        <line x1="72" y1="85" x2="115" y2="85" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
        <circle cx="140" cy="40" r="14" fill="#FF2D2D" />
        <text x="140" y="45" textAnchor="middle" fontSize="14" fontWeight="900" fill="white">0</text>
      </g>
    </svg>
  ),
  cash: () => (
    <svg viewBox="0 0 200 160" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="6" fill="rgba(34,197,94,0.10)" />
      <rect x="50" y="60" width="100" height="60" rx="8" fill="#1c1c20" stroke="rgba(34,197,94,0.4)" strokeWidth="2" />
      <circle cx="100" cy="90" r="16" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="2" />
      <text x="100" y="96" textAnchor="middle" fontSize="20" fontWeight="900" fill="rgba(34,197,94,0.8)">$</text>
    </svg>
  ),
  menu: () => (
    <svg viewBox="0 0 200 160" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="6" fill="rgba(255,45,45,0.10)" />
      <g style={{ animation: "icon-float 4s ease-in-out infinite" }}>
        <circle cx="100" cy="75" r="38" fill="#FF8A3D" />
        <ellipse cx="100" cy="62" rx="38" ry="14" fill="#D2691E" />
        <ellipse cx="100" cy="88" rx="38" ry="14" fill="#8B4513" />
        <circle cx="86" cy="62" r="3" fill="#FFD700" />
        <circle cx="110" cy="60" r="3" fill="#FFD700" />
        <circle cx="100" cy="68" r="3" fill="#FFD700" />
      </g>
    </svg>
  ),
  users: () => (
    <svg viewBox="0 0 200 160" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="6" fill="rgba(139,92,246,0.10)" />
      <circle cx="100" cy="60" r="22" fill="#1c1c20" stroke="rgba(139,92,246,0.5)" strokeWidth="2" />
      <path d="M55 130 Q100 90 145 130" fill="#1c1c20" stroke="rgba(139,92,246,0.5)" strokeWidth="2" />
      <text x="100" y="68" textAnchor="middle" fontSize="22" fontWeight="900" fill="rgba(139,92,246,0.8)">+</text>
    </svg>
  ),
  search: () => (
    <svg viewBox="0 0 200 160" className="w-44 h-36">
      <ellipse cx="100" cy="140" rx="70" ry="6" fill="rgba(255,45,45,0.10)" />
      <circle cx="90" cy="75" r="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      <line x1="113" y1="98" x2="135" y2="120" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
};

interface EmptyStateProps {
  variant?: Variant;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ variant = "search", title, message, action, className }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant];
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className ?? ""}`}>
      <div className="mb-4 opacity-90">
        <Illustration />
      </div>
      <h3 className="text-xl font-black text-white tracking-tight mb-1.5 font-display">{title}</h3>
      {message && <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
