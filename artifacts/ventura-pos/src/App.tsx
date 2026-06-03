import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useSSE } from "@/hooks/use-sse";
import { useEffect } from "react";
import { PremiumBackground } from "@/components/premium-background";
import { PageTransition } from "@/components/page-transition";

import LoginPage from "@/pages/login-page";
import MeseroPage from "@/pages/mesero-page";
import PedidoPage from "@/pages/pedido-page";
import CocinaPage from "@/pages/cocina-page";
import DashboardPage from "@/pages/dashboard-page";
import UsuariosPage from "@/pages/usuarios-page";
import CajaPage from "@/pages/caja-page";
import AdminProductosPage from "@/pages/admin/productos-page";
import AdminMesasPage from "@/pages/admin/mesas-page";
import ImpresoraPage from "@/pages/admin/impresora-page";
import PromocionesPage from "@/pages/admin/promociones-page";
import ResetPage from "@/pages/admin/reset-page";
import ConfiguracionPage from "@/pages/admin/configuracion-page";
import BackupPage from "@/pages/admin/backup-page";
import BienvenidaPage from "@/pages/bienvenida-page";
import AyudaPage from "@/pages/ayuda-page";
import NotFound from "@/pages/not-found";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { getConfiguracion } from "@/lib/configuracion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      retry: (failCount) => failCount < 2,
    },
    mutations: {
      onError: (error: any) => {
        // Only hard-redirect on 401 from a protected endpoint (not login itself)
        if (error?.status === 401 && !window.location.pathname.includes("/login")) {
          window.location.href = `${import.meta.env.BASE_URL}login`.replace("//", "/");
        }
      },
    },
  },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { usuario, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!usuario) {
        setLocation("/login");
      } else if (roles && !roles.includes(usuario.rol)) {
        if (usuario.rol === "admin") setLocation("/dashboard");
        else if (usuario.rol === "mesero") setLocation("/");
        else if (usuario.rol === "caja") setLocation("/caja");
        else setLocation("/cocina");
      }
    }
  }, [usuario, isLoading, setLocation, roles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#070708" }}>
        <PremiumBackground />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)",
              boxShadow: "0 12px 40px rgba(255,45,45,0.45)",
            }}
          >
            <span className="text-white font-black text-2xl">TB</span>
          </div>
          <div
            className="w-7 h-7 animate-spin rounded-full border-2"
            style={{ borderColor: "rgba(255,45,45,0.2)", borderTopColor: "#FF2D2D" }}
          />
          <span className="text-zinc-600 text-xs font-medium tracking-widest uppercase">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!usuario || (roles && !roles.includes(usuario.rol))) return null;
  return <Component />;
}

function SSEProvider({ children }: { children: React.ReactNode }) {
  useSSE();
  return <>{children}</>;
}

function AppRoutes() {
  const { usuario, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && usuario && location === "/login") {
      // Para admins: si la configuración aún no está hecha, llevarlos al wizard
      if (usuario.rol === "admin") {
        getConfiguracion()
          .then((c) => setLocation(c.configurado ? "/dashboard" : "/bienvenida"))
          .catch(() => setLocation("/dashboard"));
      } else if (usuario.rol === "mesero") setLocation("/");
      else if (usuario.rol === "caja") setLocation("/caja");
      else setLocation("/cocina");
    }
  }, [usuario, isLoading, location, setLocation]);

  return (
    <SSEProvider>
      <PageTransition>
      {(loc) => (
      <Switch location={loc}>
        <Route path="/login" component={LoginPage} />
        <Route path="/">
          {() => <ProtectedRoute component={MeseroPage} roles={["admin", "mesero"]} />}
        </Route>
        <Route path="/pedido">
          {() => <ProtectedRoute component={PedidoPage} roles={["admin", "mesero"]} />}
        </Route>
        <Route path="/cocina">
          {() => <ProtectedRoute component={CocinaPage} roles={["admin", "cocinero"]} />}
        </Route>
        <Route path="/dashboard">
          {() => <ProtectedRoute component={DashboardPage} roles={["admin"]} />}
        </Route>
        <Route path="/usuarios">
          {() => <ProtectedRoute component={UsuariosPage} roles={["admin"]} />}
        </Route>
        <Route path="/caja">
          {() => <ProtectedRoute component={CajaPage} roles={["admin", "caja"]} />}
        </Route>
        <Route path="/admin/productos">
          {() => <ProtectedRoute component={AdminProductosPage} roles={["admin"]} />}
        </Route>
        <Route path="/admin/mesas">
          {() => <ProtectedRoute component={AdminMesasPage} roles={["admin"]} />}
        </Route>
        <Route path="/admin/impresora">
          {() => <ProtectedRoute component={ImpresoraPage} roles={["admin"]} />}
        </Route>
        <Route path="/admin/promociones">
          {() => <ProtectedRoute component={PromocionesPage} roles={["admin"]} />}
        </Route>
        <Route path="/admin/reset">
          {() => <ProtectedRoute component={ResetPage} roles={["admin"]} />}
        </Route>
        <Route path="/admin/configuracion">
          {() => <ProtectedRoute component={ConfiguracionPage} roles={["admin"]} />}
        </Route>
        <Route path="/admin/backup">
          {() => <ProtectedRoute component={BackupPage} roles={["admin"]} />}
        </Route>
        <Route path="/bienvenida">
          {() => <ProtectedRoute component={BienvenidaPage} roles={["admin"]} />}
        </Route>
        <Route path="/ayuda">
          {() => <ProtectedRoute component={AyudaPage} roles={["admin", "mesero", "cocinero", "caja"]} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      )}
      </PageTransition>
      <PwaInstallPrompt />
    </SSEProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
