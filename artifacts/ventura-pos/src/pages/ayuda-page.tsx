import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { PremiumBackground } from "@/components/premium-background";
import { useAuth } from "@/contexts/auth-context";
import { ChevronDown, BookOpen, Users, ChefHat, Banknote, Settings, UtensilsCrossed, Printer, Database } from "lucide-react";

type Rol = "todos" | "admin" | "mesero" | "cocinero" | "caja";

interface Seccion {
  rol: Rol;
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  pasos: string[];
  tip?: string;
}

const SECCIONES: Seccion[] = [
  {
    rol: "mesero", icon: UtensilsCrossed, titulo: "Tomar un pedido",
    pasos: [
      "Tocá una mesa libre del mapa principal.",
      "Indicá número de personas y confirmá 'Nuevo pedido'.",
      "Elegí categoría → producto → cantidad y observaciones.",
      "Revisá el carrito flotante y tocá 'Confirmar pedido'.",
      "El pedido se envía automáticamente a la cocina.",
    ],
    tip: "Podés agregar más productos al pedido en cualquier momento desde la mesa ocupada.",
  },
  {
    rol: "mesero", icon: Banknote, titulo: "Cobrar una mesa",
    pasos: [
      "Tocá la mesa ocupada que tiene pedido activo.",
      "Tocá 'Cobrar mesa' en el modal de acciones.",
      "Elegí propina (0/5/10/15% o manual).",
      "Seleccioná método: efectivo, transferencia o mixto.",
      "Si es efectivo, ingresá el monto recibido — el sistema calcula el cambio.",
      "Confirmá → la mesa se libera y queda registrada en caja.",
    ],
  },
  {
    rol: "cocinero", icon: ChefHat, titulo: "Operar la pantalla de cocina",
    pasos: [
      "Las tarjetas se ordenan por antigüedad: las que llevan más tiempo aparecen primero.",
      "Tocá 'En preparación' cuando empieces a cocinar el pedido.",
      "Tocá 'Listo' cuando termines — el mesero recibe alerta.",
      "Los pedidos 'listo' desaparecen automáticamente en 30 segundos.",
      "Usá el botón fullscreen para vista TV en pantalla grande.",
    ],
    tip: "Las alertas de voz suenan al llegar pedidos nuevos. Activalas con el ícono de altavoz.",
  },
  {
    rol: "caja", icon: Banknote, titulo: "Apertura y cierre de caja",
    pasos: [
      "Al iniciar el turno, ingresá el fondo inicial (efectivo en caja).",
      "Durante el turno, podés ver el resumen: ventas, propinas, métodos de pago.",
      "Al cerrar, contá el efectivo físico e ingresá el monto.",
      "El sistema calcula la diferencia (sobrante o faltante).",
      "El cierre queda en el historial para auditoría.",
    ],
  },
  {
    rol: "admin", icon: Settings, titulo: "Gestión de productos",
    pasos: [
      "Entrá a Productos desde el menú admin.",
      "Tocá 'Nuevo producto' o editá uno existente.",
      "Completá nombre, emoji, precio, categoría y disponibilidad.",
      "Marcá 'Destacado' para mostrarlo arriba en la app de mesero.",
      "Desactivá temporalmente productos que no estén disponibles.",
    ],
  },
  {
    rol: "admin", icon: Users, titulo: "Crear usuarios del personal",
    pasos: [
      "Entrá a Usuarios desde el menú admin.",
      "Tocá 'Nuevo usuario'.",
      "Asigná un rol: admin, mesero, cocinero o caja.",
      "Definí usuario (login) y contraseña inicial.",
      "Pedile al empleado que cambie la contraseña en su primer ingreso.",
    ],
  },
  {
    rol: "admin", icon: Printer, titulo: "Configurar la impresora",
    pasos: [
      "Entrá a Impresora desde el menú admin.",
      "Modo simulado: los tickets quedan en logs para revisar.",
      "Modo real: requiere IP y puerto de la impresora térmica ESC/POS.",
      "Tocá 'Probar impresión' para verificar conexión.",
    ],
    tip: "El modo simulado es útil mientras instalás la impresora; las facturas siempre se pueden generar como PDF.",
  },
  {
    rol: "admin", icon: Database, titulo: "Backup de datos",
    pasos: [
      "Entrá a Backup desde el menú admin.",
      "Tocá 'Descargar JSON' una vez por semana como mínimo.",
      "Guardá el archivo en Google Drive, Dropbox o un USB.",
      "Si necesitás restaurar, subí el archivo y elegí 'Unir' o 'Reemplazar'.",
    ],
    tip: "Hacé backup antes de actualizar precios masivamente o cambiar el menú completo.",
  },
  {
    rol: "todos", icon: BookOpen, titulo: "Atajos útiles",
    pasos: [
      "El menú superior siempre te lleva al panel de tu rol.",
      "Tocá tu foto en la barra superior para subir avatar.",
      "Las páginas se actualizan en tiempo real — no hace falta refrescar.",
      "Si la pantalla queda en blanco, recargá con Ctrl+R o jalá hacia abajo en celular.",
    ],
  },
];

export default function AyudaPage() {
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState<Rol>("todos");
  const [abierto, setAbierto] = useState<number | null>(0);

  const rolUsuario = usuario?.rol ?? "admin";
  const visibles = SECCIONES.filter((s) => filtro === "todos" ? true : s.rol === filtro || s.rol === "todos");

  const filtros: Array<{ k: Rol; label: string }> = [
    { k: "todos", label: "Todos" },
    { k: "mesero", label: "Mesero" },
    { k: "cocinero", label: "Cocinero" },
    { k: "caja", label: "Caja" },
    { k: "admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <PremiumBackground />
      <Navigation />
      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center icon-3d">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">Manual de uso</h1>
            <p className="text-zinc-500 text-sm">Guía paso a paso · sugerido para tu rol: <strong className="text-white capitalize">{rolUsuario}</strong></p>
          </div>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filtros.map((f) => (
            <button key={f.k} onClick={() => setFiltro(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                filtro === f.k ? "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30" : "bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visibles.map((s, i) => {
            const Icon = s.icon;
            const open = abierto === i;
            return (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                <button onClick={() => setAbierto(open ? null : i)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide font-bold">{s.rol === "todos" ? "Todos" : s.rol}</div>
                    <div className="text-white font-display font-black truncate">{s.titulo}</div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-5 pb-5 space-y-2 border-t border-white/5 pt-4">
                    <ol className="space-y-2 text-sm text-zinc-300">
                      {s.pasos.map((p, j) => (
                        <li key={j} className="flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ol>
                    {s.tip && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                        <strong>💡 Tip:</strong> {s.tip}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-5 glass-card rounded-2xl text-center">
          <p className="text-sm text-zinc-400">¿Necesitás ayuda adicional? Contactá al administrador del sistema.</p>
        </div>
      </main>
    </div>
  );
}
