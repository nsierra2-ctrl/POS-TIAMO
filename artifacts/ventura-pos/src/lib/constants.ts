export const APP_NAME = "TIAMO BURGER";
export const APP_TAGLINE = "Sistema POS — Gestión de Restaurante";

export const MENU_CATEGORIAS = [
  { id: "hamburguesas", nombre: "Hamburguesas", emoji: "🍔", color: "from-orange-600/20 to-red-700/20", border: "border-orange-500/30 hover:border-orange-500/60", accent: "#f97316" },
  { id: "perros", nombre: "Perros Calientes", emoji: "🌭", color: "from-yellow-600/20 to-orange-600/20", border: "border-yellow-500/30 hover:border-yellow-500/60", accent: "#eab308" },
  { id: "papas", nombre: "Papas", emoji: "🍟", color: "from-yellow-500/20 to-amber-600/20", border: "border-yellow-400/30 hover:border-yellow-400/60", accent: "#f59e0b" },
  { id: "pizzetas", nombre: "Pizzetas", emoji: "🍕", color: "from-red-600/20 to-rose-700/20", border: "border-red-500/30 hover:border-red-500/60", accent: "#ef4444" },
  { id: "panzerotis", nombre: "Panzerotis", emoji: "🥟", color: "from-rose-600/20 to-pink-700/20", border: "border-rose-500/30 hover:border-rose-500/60", accent: "#f43f5e" },
  { id: "adicionales", nombre: "Adicionales", emoji: "➕", color: "from-zinc-600/20 to-zinc-700/20", border: "border-zinc-500/30 hover:border-zinc-500/60", accent: "#71717a" },
  { id: "bebidas", nombre: "Bebidas", emoji: "🥤", color: "from-blue-600/20 to-cyan-600/20", border: "border-blue-500/30 hover:border-blue-500/60", accent: "#3b82f6" },
  { id: "granizadas", nombre: "Granizadas", emoji: "🧊", color: "from-cyan-500/20 to-sky-600/20", border: "border-cyan-400/30 hover:border-cyan-400/60", accent: "#06b6d4" },
];

export const CATEGORIA_COLORS: Record<string, string> = Object.fromEntries(
  MENU_CATEGORIAS.map((c) => [c.id, c.color])
);
export const CATEGORIA_ACCENT: Record<string, string> = Object.fromEntries(
  MENU_CATEGORIAS.map((c) => [c.id, c.border])
);

export const formatPrice = (valor: number) => {
  return `$${valor.toLocaleString("es-CO")}`;
};

export const STATUS_COLORS: Record<string, string> = {
  libre: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ocupada: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  proceso: "bg-red-500/10 text-red-500 border-red-500/20",
  nuevo: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  preparando: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  listo: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  admin: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  mesero: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  cocinero: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};
