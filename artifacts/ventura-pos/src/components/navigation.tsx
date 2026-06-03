import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import {
  LogOut, LayoutDashboard, ChefHat, Users, UtensilsCrossed,
  Package, Settings, Banknote, Printer, Tag, BarChart3, RotateCcw,
  Camera, Building2, Database, BookOpen
} from "lucide-react";
import { useGetResumenPedidos, getGetResumenPedidosQueryKey } from "@workspace/api-client-react";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export function Navigation() {
  const [location] = useLocation();
  const { usuario, logout } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: resumen } = useGetResumenPedidos({
    query: { queryKey: getGetResumenPedidosQueryKey() },
  });

  const pedidosPendientes = (resumen?.nuevo ?? 0) + (resumen?.preparando ?? 0);

  if (!usuario) return null;

  const links: Array<{ href: string; label: string; icon: any; badge?: number }> = [];

  if (usuario.rol === "admin") {
    links.push(
      { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
      { href: "/", label: "Mesas", icon: UtensilsCrossed },
      { href: "/cocina", label: "Cocina", icon: ChefHat, badge: pedidosPendientes },
      { href: "/caja", label: "Caja", icon: Banknote },
      { href: "/admin/productos", label: "Menú", icon: Package },
      { href: "/admin/promociones", label: "Promos", icon: Tag },
      { href: "/admin/impresora", label: "Impr.", icon: Printer },
      { href: "/usuarios", label: "Personal", icon: Users },
      { href: "/admin/configuracion", label: "Negocio", icon: Building2 },
      { href: "/admin/backup", label: "Backup", icon: Database },
      { href: "/admin/mesas", label: "Config", icon: Settings },
      { href: "/ayuda", label: "Ayuda", icon: BookOpen },
      { href: "/admin/reset", label: "Reset", icon: RotateCcw },
    );
  } else if (usuario.rol === "mesero") {
    links.push(
      { href: "/", label: "Mesas", icon: UtensilsCrossed },
      { href: "/pedido", label: "Pedido", icon: Package },
      { href: "/ayuda", label: "Ayuda", icon: BookOpen },
    );
  } else if (usuario.rol === "cocinero") {
    links.push(
      { href: "/cocina", label: "Cocina", icon: ChefHat, badge: pedidosPendientes },
      { href: "/ayuda", label: "Ayuda", icon: BookOpen },
    );
  } else if (usuario.rol === "caja") {
    links.push(
      { href: "/caja", label: "Caja", icon: Banknote },
      { href: "/ayuda", label: "Ayuda", icon: BookOpen },
    );
  }

  const ROL_COLORS: Record<string, string> = {
    admin: "#8b5cf6",
    mesero: "#0ea5e9",
    cocinero: "#f97316",
    caja: "#22c55e",
  };
  const rolColor = ROL_COLORS[usuario.rol] ?? "#FF2D2D";

  const ROL_LABELS: Record<string, string> = {
    admin: "Admin", mesero: "Mesero", cocinero: "Cocinero", caja: "Cajero",
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        await customFetch(`/api/usuarios/${usuario.id}/foto`, {
          method: "PUT",
          body: JSON.stringify({ fotoUrl: dataUrl }),
          headers: { "content-type": "application/json" },
        });
        queryClient.invalidateQueries();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
    e.target.value = "";
  };

  return (
    <header
      className={`border-b border-white/5 sticky top-0 z-40 transition-all duration-300 ${scrolled ? "nav-scrolled" : ""}`}
      style={{
        background: "rgba(8,8,10,0.92)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div className="max-w-screen-2xl mx-auto w-full px-4 h-14 nav-shrinkable transition-all duration-300 flex items-center justify-between gap-4">
        {/* Logo + nav */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href={usuario.rol === "admin" ? "/dashboard" : usuario.rol === "mesero" ? "/" : usuario.rol === "caja" ? "/caja" : "/cocina"}>
            <div className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-red-500/30"
                style={{
                  background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)",
                  boxShadow: "0 4px 14px rgba(255,45,45,0.35)",
                }}
              >
                <span className="text-white font-black text-xs tracking-tight">TB</span>
              </div>
              <span className="font-black text-sm text-white tracking-tight hidden lg:block font-display">TIAMO BURGER</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center ml-3 gap-0.5 overflow-x-auto scrollbar-none">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    type="button"
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:text-white hover:bg-white/5"
                    }`}
                    style={isActive ? { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" } : {}}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.label}
                    {(link.badge ?? 0) > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white px-1 animate-pulse"
                        style={{ background: "#FF2D2D", boxShadow: "0 2px 8px rgba(255,45,45,0.6)" }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Avatar with photo upload */}
          <div className="relative group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                background: usuario.fotoUrl ? "transparent" : `${rolColor}22`,
                border: `2px solid ${rolColor}50`,
                boxShadow: `0 0 12px ${rolColor}25`,
              }}
              title="Cambiar foto"
            >
              {uploading ? (
                <div className="w-3 h-3 animate-spin rounded-full border border-white/30 border-t-white" />
              ) : usuario.fotoUrl ? (
                <img src={usuario.fotoUrl} alt={usuario.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-black text-white">
                  {usuario.nombre.substring(0, 2).toUpperCase()}
                </span>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera size={10} className="text-white" />
              </div>
            </button>
            {/* Online indicator */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080810] animate-pulse"
              style={{ background: "#22c55e" }}
            />
          </div>

          {/* Name + role */}
          <div className="hidden md:block text-right">
            <div className="text-xs font-semibold leading-none text-white">{usuario.nombre}</div>
            <div
              className="text-[9px] font-black uppercase tracking-wider mt-0.5"
              style={{ color: rolColor }}
            >
              {ROL_LABELS[usuario.rol] ?? usuario.rol}
            </div>
          </div>

          {/* Logout button — prominent */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 border ml-1"
            style={{
              background: "rgba(255,45,45,0.06)",
              borderColor: "rgba(255,45,45,0.15)",
              color: "rgba(255,100,100,0.7)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,45,45,0.14)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,45,45,0.35)";
              (e.currentTarget as HTMLElement).style.color = "#FF6B6B";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,45,45,0.06)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,45,45,0.15)";
              (e.currentTarget as HTMLElement).style.color = "rgba(255,100,100,0.7)";
            }}
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Salir</span>
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-white/5 flex justify-around items-center z-50"
        style={{ background: "rgba(8,8,10,0.97)", backdropFilter: "blur(24px)" }}
      >
        {links.slice(0, 4).map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-150 ${
                isActive ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{link.label}</span>
              {(link.badge ?? 0) > 0 && (
                <span
                  className="absolute top-2 left-1/2 translate-x-2 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[8px] font-black text-white px-1"
                  style={{ background: "#FF2D2D" }}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
        {/* Logout in mobile nav */}
        <button
          onClick={logout}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 text-zinc-700 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-semibold">Salir</span>
        </button>
      </nav>
    </header>
  );
}
