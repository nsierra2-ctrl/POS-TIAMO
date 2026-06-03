import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Trash2, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ResetPage() {
  const { toast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const r = await fetch(`${BASE}/api/admin/reset`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Error al reiniciar");
      const data = await r.json();
      setDone(true);
      setConfirm(false);
      toast({ title: "Datos reiniciados correctamente", description: `Pedidos: ${data.pedidosEliminados ?? 0} · Caja: ${data.cajaSesionesEliminadas ?? 0}` });
    } catch (e: any) {
      toast({ title: "Error al reiniciar datos", description: e.message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20 md:pb-0">
      <Navigation />
      <main className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight font-display">Reiniciar Datos</h1>
          <p className="text-zinc-500 text-sm mt-1">Herramientas de administración del sistema</p>
        </div>

        <div className="space-y-4">
          {/* Reset card */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.15)" }}>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-white text-lg mb-1">Reiniciar todos los datos</h3>
                  <p className="text-zinc-500 text-sm mb-4">
                    Elimina todos los pedidos y sesiones de caja. Libera todas las mesas. Los productos, usuarios y configuración se mantienen intactos.
                  </p>
                  <div className="flex flex-col gap-2 mb-5">
                    {[
                      "Todos los pedidos activos e históricos",
                      "Todas las sesiones de caja",
                      "Estado de mesas → libre",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-red-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 mb-5">
                    {[
                      "Productos y categorías",
                      "Usuarios y contraseñas",
                      "Promociones configuradas",
                      "Mesas (solo se liberan, no se eliminan)",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        {item} se conserva
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {done && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Datos reiniciados correctamente. El sistema esta listo para un nuevo dia.
                </div>
              )}

              {!confirm ? (
                <Button
                  onClick={() => setConfirm(true)}
                  className="w-full font-bold gap-2 h-11"
                  style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Reiniciar todos los datos
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-400 text-sm font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Esta accion es irreversible. Confirma que deseas continuar.
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 border-white/10 text-zinc-400" onClick={() => setConfirm(false)}>
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 font-black gap-2 h-11"
                      style={{ background: "linear-gradient(135deg,#dc2626,#7f1d1d)" }}
                      onClick={handleReset}
                      disabled={resetting}
                    >
                      {resetting
                        ? <><RefreshCw className="w-4 h-4 animate-spin" />Reiniciando...</>
                        : <><Trash2 className="w-4 h-4" />Confirmar Reset</>
                      }
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-bold text-zinc-400">Uso recomendado</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li>• Usa esta funcion al cierre del dia despues de haber impreso los reportes</li>
              <li>• Asegurate de haber cerrado la sesion de caja antes de reiniciar</li>
              <li>• Esta accion no afecta las credenciales de acceso ni los productos del menu</li>
              <li>• Solo disponible para administradores del sistema</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
