import { useState } from "react";
import {
  useGetMesas,
  useCrearMesa,
  useEliminarMesa,
  useActualizarMesa,
  useGetPedidos,
} from "@workspace/api-client-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, LayoutGrid, List, RefreshCw } from "lucide-react";

const ESTADO_BADGE: Record<string, string> = {
  libre: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ocupada: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  proceso: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminMesasPage() {
  const { toast } = useToast();
  const [newNumero, setNewNumero] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: mesas, isLoading, refetch } = useGetMesas();
  const { data: pedidos } = useGetPedidos();
  const crearMutation = useCrearMesa();
  const eliminarMutation = useEliminarMesa();
  const actualizarMutation = useActualizarMesa();

  const handleCrear = () => {
    const num = newNumero.trim();
    if (!num || num.length > 20) {
      toast({ title: "Nombre de mesa inválido (1-20 caracteres)", variant: "destructive" });
      return;
    }
    if (mesas?.some((m) => m.numero === num)) {
      toast({ title: `La mesa ${num} ya existe`, variant: "destructive" });
      return;
    }
    crearMutation.mutate(
      { data: { numero: num } },
      {
        onSuccess: () => {
          toast({ title: `Mesa ${num} creada` });
          setNewNumero("");
        },
        onError: () => toast({ title: "Error al crear mesa", variant: "destructive" }),
      },
    );
  };

  const handleEliminar = (numero: string) => {
    const mesa = mesas?.find((m) => m.numero === numero);
    if (mesa?.estado !== "libre") {
      toast({ title: "Solo se pueden eliminar mesas libres", variant: "destructive" });
      return;
    }
    if (!confirm(`¿Eliminar mesa ${numero}?`)) return;
    eliminarMutation.mutate(
      { numero },
      {
        onSuccess: () => toast({ title: `Mesa ${numero} eliminada` }),
        onError: () => toast({ title: "Error al eliminar mesa", variant: "destructive" }),
      },
    );
  };

  const handleLiberarMesa = (numero: string) => {
    actualizarMutation.mutate(
      { numero, data: { estado: "libre", personas: 0 } },
      {
        onSuccess: () => toast({ title: `Mesa ${numero} liberada` }),
        onError: () => toast({ title: "Error al liberar mesa", variant: "destructive" }),
      },
    );
  };

  const getPedidosActivos = (mesaNum: string) =>
    pedidos?.filter((p) => p.mesa === mesaNum && p.estado !== "listo") ?? [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20 md:pb-0">
      <Navigation />

      <div className="max-w-screen-xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white font-display tracking-tight">Gestión de Mesas</h1>
            <p className="text-zinc-500 text-sm">{mesas?.length ?? 0} mesas configuradas</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${view === "grid" ? "bg-white/10 text-white" : "text-zinc-600 hover:text-white"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${view === "list" ? "bg-white/10 text-white" : "text-zinc-600 hover:text-white"}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Libres", value: mesas?.filter((m) => m.estado === "libre").length ?? 0, color: "#22c55e" },
            { label: "Ocupadas", value: mesas?.filter((m) => m.estado !== "libre").length ?? 0, color: "#f59e0b" },
            { label: "Con Pedidos Activos", value: new Set(pedidos?.filter((p) => p.estado !== "listo").map((p) => p.mesa)).size, color: "#FF2D2D" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/5 p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="text-3xl font-black font-mono" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-zinc-500 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Add table */}
        <div className="rounded-2xl border border-white/5 p-4 mb-6" style={{ background: "rgba(255,255,255,0.02)" }}>
          <h3 className="text-sm font-bold text-zinc-400 mb-3">Agregar Mesa Nueva</h3>
          <div className="flex gap-3">
            <Input
              type="text"
              value={newNumero}
              onChange={(e) => setNewNumero(e.target.value)}
              placeholder="Nombre de mesa (ej: Terraza A)"
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-700 flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCrear()}
            />
            <Button
              onClick={handleCrear}
              disabled={crearMutation.isPending || !newNumero}
              className="font-bold"
              style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)" }}
            >
              <Plus size={16} className="mr-2" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Tables */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {[...Array(10)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {mesas?.sort((a, b) => String(a.numero).localeCompare(String(b.numero))).map((mesa) => {
              const pedidosActivos = getPedidosActivos(mesa.numero);
              const estadoBadge = ESTADO_BADGE[mesa.estado] || ESTADO_BADGE.libre;

              return (
                <div
                  key={mesa.numero}
                  className="group relative rounded-2xl border border-white/8 p-4 flex flex-col items-center gap-2 text-center"
                  style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)" }}
                >
                  <div className="text-4xl font-black font-mono text-white">{mesa.numero}</div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${estadoBadge}`}>
                    {mesa.estado}
                  </span>
                  {pedidosActivos.length > 0 && (
                    <span className="text-xs text-zinc-500">{pedidosActivos.length} pedido{pedidosActivos.length !== 1 ? "s" : ""}</span>
                  )}
                  <div className="flex gap-1 mt-1">
                    {mesa.estado !== "libre" && (
                      <button
                        onClick={() => handleLiberarMesa(mesa.numero)}
                        className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                      >
                        Liberar
                      </button>
                    )}
                    {mesa.estado === "libre" && (
                      <button
                        onClick={() => handleEliminar(mesa.numero)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-red-500/0 hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3">Mesa</th>
                  <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3">Personas</th>
                  <th className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3">Pedidos Activos</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {mesas?.sort((a, b) => String(a.numero).localeCompare(String(b.numero))).map((mesa) => {
                  const pedidosActivos = getPedidosActivos(mesa.numero);
                  return (
                    <tr key={mesa.numero} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-2xl font-black font-mono text-white">{mesa.numero}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${ESTADO_BADGE[mesa.estado] || ESTADO_BADGE.libre}`}>
                          {mesa.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-400 text-sm">{mesa.personas || 0}</td>
                      <td className="px-4 py-3 text-center">
                        {pedidosActivos.length > 0 ? (
                          <span className="text-amber-400 text-sm font-bold">{pedidosActivos.length}</span>
                        ) : (
                          <span className="text-zinc-700 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {mesa.estado !== "libre" && (
                            <button
                              onClick={() => handleLiberarMesa(mesa.numero)}
                              className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                            >
                              Liberar
                            </button>
                          )}
                          {mesa.estado === "libre" && (
                            <button
                              onClick={() => handleEliminar(mesa.numero)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
