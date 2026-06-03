import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Lock, User, Zap, Shield, Sparkles } from "lucide-react";
import { PremiumBackground } from "@/components/premium-background";

const DEMO_CREDS = [
  { user: "fernando", pass: "0624", label: "Admin", color: "#8b5cf6" },
  { user: "ingrid", pass: "1234", label: "Mesero", color: "#0ea5e9" },
  { user: "zaira", pass: "1234", label: "Mesero 2", color: "#06b6d4" },
  { user: "cocina", pass: "1234", label: "Cocina", color: "#f97316" },
  { user: "caja", pass: "caja", label: "Caja", color: "#22c55e" },
];

type AppMode = "demo" | "real";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [hora, setHora] = useState(new Date());
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      return (localStorage.getItem("tiamo:mode") as AppMode) || "demo";
    } catch {
      return "demo";
    }
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tiamo:mode", mode);
    } catch {}
  }, [mode]);

  const doLogin = (user: string, pass: string) => {
    if (!user || !pass) return;
    loginMutation.mutate(
      { data: { usuario: user, contrasena: pass } },
      {
        onSuccess: (userData) => {
          // Save bearer token for iframe environments where cookies don't persist
          try {
            if ((userData as any).token) {
              localStorage.setItem("tiamo:token", (userData as any).token);
            }
          } catch {}
          // Full page reload to clear any stuck React Query error state.
          // On reload, useGetMe fetches fresh with the Bearer token from localStorage.
          const base = import.meta.env.BASE_URL.replace(/\/$/, "");
          const target =
            userData.rol === "admin"
              ? "/dashboard"
              : userData.rol === "mesero"
                ? "/"
                : userData.rol === "cocinero"
                  ? "/cocina"
                  : "/caja";
          window.location.href = base + target;
        },
        onError: () => {
          toast({
            title: "Credenciales inválidas",
            description: "Verifica usuario y contraseña",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(usuario, contrasena);
  };

  const horaStr = hora.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const fechaStr = hora.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none"
      style={{ background: "#070708" }}
    >
      <PremiumBackground variant="food" />

      {/* Floating burger emojis - 4K vibe */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {["🍔", "🍟", "🥤", "🌭", "🍕", "🥗", "🍰", "🥩"].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-6xl opacity-[0.04] select-none"
            style={{
              left: `${(i * 13 + 7) % 95}%`,
              top: `${(i * 17 + 11) % 90}%`,
              filter: "blur(0.5px)",
              animation: `float-emoji ${20 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
              transform: `rotate(${i * 30}deg)`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Mode toggle */}
        <div className="flex justify-center mb-6">
          <div
            className="inline-flex p-1 rounded-2xl border"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <button
              type="button"
              onClick={() => setMode("demo")}
              className="relative px-4 py-1.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all duration-300"
              style={{
                background: mode === "demo" ? "linear-gradient(135deg,#FF2D2D,#CC0000)" : "transparent",
                color: mode === "demo" ? "white" : "rgba(255,255,255,0.5)",
                boxShadow: mode === "demo" ? "0 4px 16px rgba(255,45,45,0.4)" : "none",
              }}
              data-testid="button-mode-demo"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Demo
            </button>
            <button
              type="button"
              onClick={() => setMode("real")}
              className="relative px-4 py-1.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all duration-300"
              style={{
                background: mode === "real" ? "linear-gradient(135deg,#10b981,#059669)" : "transparent",
                color: mode === "real" ? "white" : "rgba(255,255,255,0.5)",
                boxShadow: mode === "real" ? "0 4px 16px rgba(16,185,129,0.4)" : "none",
              }}
              data-testid="button-mode-real"
            >
              <Shield className="w-3 h-3 inline mr-1" />
              Producción
            </button>
          </div>
        </div>

        {/* Clock */}
        <div className="text-center mb-6">
          <div
            className="text-5xl font-black text-white tracking-tight tabular-nums mb-1"
            style={{
              textShadow: "0 0 60px rgba(255,45,45,0.3)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {horaStr}
          </div>
          <div className="text-zinc-500 text-sm capitalize font-medium">{fechaStr}</div>
        </div>

        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4 perspective-card">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center logo-3d"
              style={{
                background: "linear-gradient(135deg,#FF2D2D 0%,#991b1b 100%)",
                boxShadow:
                  "0 0 0 1px rgba(255,45,45,0.3), 0 20px 60px rgba(255,45,45,0.45), inset 0 2px 0 rgba(255,255,255,0.2)",
              }}
            >
              <ChefHat className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
            <div
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 flex items-center justify-center"
              style={{
                borderColor: "#070708",
                animation: "dot-pulse 2s ease-in-out infinite",
              }}
            >
              <Zap className="w-3.5 h-3.5 text-white" fill="white" />
            </div>
          </div>
          <h1
            className="text-4xl font-black tracking-tight text-white"
            style={{
              letterSpacing: "-0.02em",
              textShadow: "0 0 40px rgba(255,45,45,0.15)",
            }}
          >
            TIAMO BURGER
          </h1>
          <p className="text-zinc-600 text-xs font-semibold tracking-[0.3em] uppercase mt-1">
            Sistema POS · v2.0
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-3xl border overflow-hidden mb-4 card-3d"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 60px rgba(255,45,45,0.08)",
          }}
        >
          <div className="px-6 pt-6 pb-2">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              Iniciar sesión {mode === "real" && <span className="text-emerald-500">· Modo Producción</span>}
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors" />
                <Input
                  placeholder="Usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="h-12 pl-10 border-white/10 text-white placeholder:text-zinc-700 focus:border-red-500/50 transition-all rounded-xl text-sm"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  autoComplete="username"
                  data-testid="input-usuario"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="h-12 pl-10 border-white/10 text-white placeholder:text-zinc-700 focus:border-red-500/50 transition-all rounded-xl text-sm"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  autoComplete="current-password"
                  data-testid="input-contrasena"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-sm font-black tracking-wide rounded-xl mt-2 ripple-btn relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)",
                  boxShadow: "0 8px 32px rgba(255,45,45,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando sesión...
                  </span>
                ) : (
                  "Acceder al Sistema"
                )}
              </Button>
            </form>
          </div>

          {mode === "demo" && (
            <div className="px-6 py-5 border-t border-white/5">
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Acceso rápido · demo
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDS.map((cred) => (
                  <button
                    key={cred.user}
                    type="button"
                    onClick={() => {
                      setUsuario(cred.user);
                      setContrasena("");
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      borderColor: `${cred.color}25`,
                      background: `${cred.color}0a`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${cred.color}55`;
                      (e.currentTarget as HTMLElement).style.background = `${cred.color}18`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${cred.color}25`;
                      (e.currentTarget as HTMLElement).style.background = `${cred.color}0a`;
                    }}
                    data-testid={`button-demo-${cred.user}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: cred.color,
                        boxShadow: `0 0 8px ${cred.color}`,
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {cred.label}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-600">{cred.user}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "real" && (
            <div className="px-6 py-5 border-t border-white/5">
              <div
                className="rounded-xl p-3 border flex items-start gap-3"
                style={{
                  background: "rgba(16,185,129,0.06)",
                  borderColor: "rgba(16,185,129,0.18)",
                }}
              >
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-400 leading-tight">
                    Modo Producción Activo
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                    Solo usuarios autorizados. Auditoría completa, rate-limit y cifrado activos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-zinc-800 font-mono">
          TIAMO BURGER POS © {new Date().getFullYear()} · v2.0 Production Ready
        </p>
      </div>
    </div>
  );
}
