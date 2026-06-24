import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCobrarPedido, getGetPedidosQueryKey, getGetMesasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/constants";
import { Banknote, CreditCard, Split, Check, Printer, DoorOpen, Gift, Receipt } from "lucide-react";

type MetodoPago = "efectivo" | "tarjeta" | "transferencia" | "mixto";
type TipoTarjeta = "debito" | "credito" | "datafono" | "daviplata" | "nequi" | "boton_bancolombia";

interface CobrarModalProps {
  pedido: {
    id: number;
    mesa: string;
    total: number;
    items?: any[];
  } | null;
  open: boolean;
  onClose: () => void;
}

const BILLETES = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

const TIPO_TARJETA_LABELS: Record<TipoTarjeta, string> = {
  debito: "Débito",
  credito: "Crédito",
  datafono: "Datáfono",
  daviplata: "DaviPlata",
  nequi: "Nequi",
  boton_bancolombia: "Botón Bancolombia",
};

export function CobrarModal({ pedido, open, onClose }: CobrarModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cobrarMutation = useCobrarPedido();

  // Paso 1: formulario de cobro
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [efectivoStr, setEfectivoStr] = useState("");
  const [tarjetaStr, setTarjetaStr] = useState("");
  const [transferenciaStr, setTransferenciaStr] = useState("");
  const [tipoTarjeta, setTipoTarjeta] = useState<TipoTarjeta | null>(null);
  const [bancoTarjeta, setBancoTarjeta] = useState("");
  const [referenciaTarjeta, setReferenciaTarjeta] = useState("");
  const [ultimos4Tarjeta, setUltimos4Tarjeta] = useState("");

  // Paso 2: propina + cierre
  const [paso, setPaso] = useState<1 | 2>(1);
  const [cambioFinal, setCambioFinal] = useState(0);
  const [pedidoCobradoId, setPedidoCobradoId] = useState<number | null>(null);
  const [numeroFactura, setNumeroFactura] = useState<string | null>(null);
  const [propinaStr, setPropinaStr] = useState("");
  const [propinaPct, setPropinaPct] = useState<number | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const total = pedido?.total ?? 0;

  const efectivo = parseInt(efectivoStr.replace(/\D/g, "") || "0") || 0;
  const tarjeta = parseInt(tarjetaStr.replace(/\D/g, "") || "0") || 0;
  const transferencia = parseInt(transferenciaStr.replace(/\D/g, "") || "0") || 0;

  const montoPagado = (() => {
    if (metodo === "efectivo") return efectivo;
    if (metodo === "tarjeta") return tarjeta;
    if (metodo === "transferencia") return transferencia;
    return efectivo + tarjeta + transferencia;
  })();

  const cambio = metodo === "efectivo" ? Math.max(0, efectivo - total) : 0;
  const faltante = Math.max(0, total - montoPagado);

  const propina = (() => {
    if (propinaPct !== null) return Math.round(total * propinaPct / 100);
    const v = parseInt(propinaStr.replace(/\D/g, "") || "0");
    return isNaN(v) ? 0 : v;
  })();
  const propinaSugerida = propinaPct !== null ? Math.round(total * propinaPct / 100) : 0;

  const puedeConfirmar = (() => {
    if (metodo === "transferencia") return true;
    if (metodo === "tarjeta") return tarjeta >= total && tipoTarjeta !== null;
    if (metodo === "mixto") return montoPagado >= total;
    return montoPagado >= total;
  })();

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString("es-CO") : "";
  };

  useEffect(() => {
    if (!open) {
      setMetodo("efectivo");
      setEfectivoStr("");
      setTarjetaStr("");
      setTransferenciaStr("");
      setTipoTarjeta(null);
      setBancoTarjeta("");
      setReferenciaTarjeta("");
      setUltimos4Tarjeta("");
      setPaso(1);
      setCambioFinal(0);
      setPedidoCobradoId(null);
      setNumeroFactura(null);
      setPropinaStr("");
      setPropinaPct(null);
      setCerrando(false);
      setProcesando(false);
    }
  }, [open]);

  const abrirFactura = (id: number) => {
    const url = `/api/pedidos/${id}/factura?autoprint=1`;
    const win = window.open(url, "_blank");
    if (!win) toast({ title: "Permite ventanas emergentes para imprimir", variant: "destructive" });
  };

  const handleCobrar = async () => {
    if (!pedido || !puedeConfirmar) return;
    setProcesando(true);
    try {
      const pagos: any[] = [];
      if (metodo === "efectivo") {
        pagos.push({ metodo: "efectivo", monto: Math.min(efectivo, total) });
      } else if (metodo === "tarjeta") {
        pagos.push({
          metodo: "tarjeta",
          monto: total,
          tipoTarjeta: tipoTarjeta!,
          banco: bancoTarjeta || undefined,
          referencia: referenciaTarjeta || undefined,
          ultimos4: ultimos4Tarjeta || undefined,
        });
      } else if (metodo === "transferencia") {
        pagos.push({ metodo: "transferencia", monto: total });
      } else {
        if (efectivo > 0) pagos.push({ metodo: "efectivo", monto: efectivo });
        if (tarjeta > 0) pagos.push({
          metodo: "tarjeta",
          monto: tarjeta,
          tipoTarjeta: tipoTarjeta!,
          banco: bancoTarjeta || undefined,
          referencia: referenciaTarjeta || undefined,
          ultimos4: ultimos4Tarjeta || undefined,
        });
        if (transferencia > 0) pagos.push({ metodo: "transferencia", monto: transferencia });
      }

      const r = await cobrarMutation.mutateAsync({
        id: pedido.id,
        data: {
          pagos,
          propina: 0,
          propinaSugerida: propinaSugerida,
          propinaAceptada: 0,
          nota: "Cobrado",
        },
      });

      queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });

      const cambioCalc = (r as any).cambio ?? Math.max(0, efectivo - total);
      setCambioFinal(cambioCalc);
      setPedidoCobradoId(pedido.id);
      setNumeroFactura((r as any).numeroFactura ?? null);

      // Imprimir factura automáticamente (sin propina aún)
      abrirFactura(pedido.id);

      setPaso(2);
    } catch (e: any) {
      toast({ title: "Error al cobrar", description: e?.message ?? "Error desconocido", variant: "destructive" });
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarMesa = async (conPropina: boolean) => {
    if (!pedido) return;
    setCerrando(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const propinaFinal = conPropina ? propina : 0;
      const body = propinaFinal > 0
        ? { propina: propinaFinal, propinaAceptada: propinaFinal, propinaRechazada: propinaSugerida > propinaFinal ? propinaSugerida - propinaFinal : 0 }
        : {};
      await fetch(`${base}/api/mesas/${encodeURIComponent(pedido.mesa)}/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });

      // Si hubo propina, reimprimir la factura actualizada
      if (conPropina && propina > 0 && pedidoCobradoId) {
        setTimeout(() => abrirFactura(pedidoCobradoId), 600);
      }

      toast({
        title: "Mesa cerrada",
        description: conPropina && propina > 0
          ? `Propina ${formatPrice(propina)} registrada. Mesa ${pedido.mesa} libre.`
          : `Mesa ${pedido.mesa} liberada.`,
      });
      onClose();
    } catch {
      toast({ title: "Error al cerrar mesa", variant: "destructive" });
    } finally {
      setCerrando(false);
    }
  };

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !procesando && !cerrando && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0e0e10] border-white/8 text-white p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-lg font-black flex items-center gap-2">
            <Banknote className="w-5 h-5" style={{ color: "#FF2D2D" }} />
            {paso === 1 ? `Cobrar Mesa ${pedido.mesa}` : `Mesa ${pedido.mesa} — Cobrada`}
          </DialogTitle>
        </DialogHeader>

        {/* ══════════════════════════════════════════════ */}
        {/* PASO 1: Formulario de pago                    */}
        {/* ══════════════════════════════════════════════ */}
        {paso === 1 && (
          <div className="px-6 pb-6 pt-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center py-3 px-4 rounded-xl border border-white/8 bg-white/3">
              <span className="text-zinc-400 font-semibold text-sm">Total a cobrar</span>
              <span className="text-3xl font-black font-mono text-white">{formatPrice(total)}</span>
            </div>

            {/* Método de pago */}
            <div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Forma de pago</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "efectivo", label: "Efectivo", icon: Banknote },
                  { key: "tarjeta", label: "Tarjeta", icon: CreditCard },
                  { key: "transferencia", label: "Transfer", icon: Receipt },
                  { key: "mixto", label: "Mixto", icon: Split },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMetodo(key as MetodoPago)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all ${
                      metodo === key
                        ? "border-red-500/50 bg-red-500/10 text-red-400"
                        : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto en efectivo */}
            {(metodo === "efectivo" || metodo === "mixto") && (
              <div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {metodo === "mixto" ? "Efectivo recibido" : "Monto recibido"}
                </div>
                <Input
                  placeholder="0"
                  value={efectivoStr}
                  onChange={(e) => setEfectivoStr(formatInput(e.target.value))}
                  className="bg-white/3 border-white/10 text-white placeholder:text-zinc-700 font-mono text-xl h-12"
                  autoFocus={metodo === "efectivo"}
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {BILLETES.filter((b) => b >= total * 0.8 && b <= total * 2.5).slice(0, 5).map((b) => (
                    <button
                      key={b}
                      onClick={() => setEfectivoStr(b.toLocaleString("es-CO"))}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-xs font-bold text-zinc-400 hover:bg-white/10 transition-colors"
                    >
                      {formatPrice(b)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tarjeta */}
            {(metodo === "tarjeta" || (metodo === "mixto" && tarjeta > 0)) && (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
                    {metodo === "mixto" ? "Tarjeta (complemento)" : "Monto tarjeta"}
                  </div>
                  <Input
                    placeholder="0"
                    value={tarjetaStr}
                    onChange={(e) => setTarjetaStr(formatInput(e.target.value))}
                    className="bg-white/3 border-white/10 text-white placeholder:text-zinc-700 font-mono text-xl h-12"
                    autoFocus={metodo === "tarjeta"}
                  />
                </div>
                {/* Tipo de tarjeta */}
                <div>
                  <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Tipo de tarjeta</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(TIPO_TARJETA_LABELS) as TipoTarjeta[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTipoTarjeta(t)}
                        className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                          tipoTarjeta === t
                            ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                            : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"
                        }`}
                      >
                        {TIPO_TARJETA_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Banco (opcional)"
                    value={bancoTarjeta}
                    onChange={(e) => setBancoTarjeta(e.target.value)}
                    className="bg-white/3 border-white/10 text-white placeholder:text-zinc-700 h-10"
                  />
                  <Input
                    placeholder="Referencia (opcional)"
                    value={referenciaTarjeta}
                    onChange={(e) => setReferenciaTarjeta(e.target.value)}
                    className="bg-white/3 border-white/10 text-white placeholder:text-zinc-700 h-10"
                  />
                </div>
                <Input
                  placeholder="Últimos 4 dígitos (opcional)"
                  value={ultimos4Tarjeta}
                  onChange={(e) => setUltimos4Tarjeta(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="bg-white/3 border-white/10 text-white placeholder:text-zinc-700 h-10"
                />
              </div>
            )}

            {/* Monto transferencia */}
            {(metodo === "transferencia" || metodo === "mixto") && (
              <div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">
                  {metodo === "mixto" ? "Transferencia (complemento)" : "Monto transferencia"}
                </div>
                <Input
                  placeholder="0"
                  value={transferenciaStr}
                  onChange={(e) => setTransferenciaStr(formatInput(e.target.value))}
                  className="bg-white/3 border-white/10 text-white placeholder:text-zinc-700 font-mono text-xl h-12"
                  autoFocus={metodo === "transferencia"}
                />
              </div>
            )}

            {/* Cambio en tiempo real */}
            {metodo === "efectivo" && efectivo > 0 && (
              <div className={`flex justify-between items-center px-4 py-3 rounded-xl border ${
                cambio >= 0 && efectivo >= total
                  ? "border-emerald-500/20 bg-emerald-500/6"
                  : "border-red-500/20 bg-red-500/6"
              }`}>
                <span className="font-bold text-sm text-zinc-300">
                  {efectivo >= total ? "💵 Dar cambio" : "❌ Faltan"}
                </span>
                <span className={`font-black font-mono text-2xl ${efectivo >= total ? "text-emerald-400" : "text-red-400"}`}>
                  {efectivo >= total ? formatPrice(cambio) : formatPrice(faltante)}
                </span>
              </div>
            )}

            {metodo === "mixto" && montoPagado > 0 && faltante > 0 && (
              <div className="flex justify-between items-center px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/6">
                <span className="font-bold text-sm text-zinc-300">❌ Faltan</span>
                <span className="font-black font-mono text-2xl text-red-400">{formatPrice(faltante)}</span>
              </div>
            )}

            {metodo === "tarjeta" && tipoTarjeta === null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-500/6">
                <span className="text-xs text-amber-400 font-bold">⚠️ Selecciona el tipo de tarjeta</span>
              </div>
            )}

            <Button
              onClick={handleCobrar}
              disabled={procesando || !puedeConfirmar}
              className="w-full h-14 font-black text-lg gap-2 rounded-xl"
              style={{
                background: puedeConfirmar
                  ? "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)"
                  : "rgba(255,255,255,0.05)",
              }}
            >
              {procesando
                ? <><div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Procesando...</>
                : `Cobrar ${formatPrice(total)}`}
            </Button>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* PASO 2: Cambio + Propina + Cerrar mesa        */}
        {/* ══════════════════════════════════════════════ */}
        {paso === 2 && (
          <div className="px-6 pb-6 pt-4 space-y-4">
            {/* Banner cambio */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white">¡Pago registrado!</div>
                <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                  <Printer className="w-3 h-3" />
                  Factura impresa automáticamente
                </div>
                {numeroFactura && (
                  <div className="text-xs text-emerald-400/70 font-bold mt-0.5">Factura #{numeroFactura}</div>
                )}
              </div>
              {cambioFinal > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider">Dar cambio</div>
                  <div className="text-2xl font-black font-mono text-emerald-400">{formatPrice(cambioFinal)}</div>
                </div>
              )}
            </div>

            {/* Resumen */}
            <div className="rounded-xl border border-white/5 px-4 py-3 bg-white/2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total cobrado</span>
                <span className="font-black font-mono text-white">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Propina */}
            <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">¿Dejó propina el cliente?</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Sin propina", pct: 0 },
                  { label: "5%", pct: 5 },
                  { label: "10%", pct: 10 },
                  { label: "15%", pct: 15 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setPropinaPct(p.pct); setPropinaStr(""); }}
                    className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                      propinaPct === p.pct && !propinaStr
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        : "border-white/8 bg-white/3 text-zinc-500 hover:border-white/15"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <Input
                placeholder="Monto exacto de propina ($)"
                value={propinaStr}
                onChange={(e) => { setPropinaStr(formatInput(e.target.value)); setPropinaPct(null); }}
                className="bg-white/3 border-white/10 text-white placeholder:text-zinc-700 h-10"
              />

              {propina > 0 && (
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-amber-500/8 border border-amber-500/15">
                  <span className="text-xs font-bold text-amber-400">Propina a registrar</span>
                  <span className="font-black font-mono text-amber-400">{formatPrice(propina)}</span>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="space-y-2">
              {propina > 0 ? (
                <Button
                  onClick={() => handleCerrarMesa(true)}
                  disabled={cerrando}
                  className="w-full h-12 font-black text-base gap-2 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)" }}
                >
                  {cerrando
                    ? <><div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Cerrando...</>
                    : <><Gift className="w-4 h-4" />Registrar propina y cerrar mesa</>}
                </Button>
              ) : (
                <Button
                  onClick={() => handleCerrarMesa(false)}
                  disabled={cerrando}
                  className="w-full h-12 font-black text-base gap-2 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)" }}
                >
                  {cerrando
                    ? <><div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Cerrando...</>
                    : <><DoorOpen className="w-4 h-4" />Cerrar mesa</>}
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => pedidoCobradoId && abrirFactura(pedidoCobradoId)}
                className="w-full h-9 text-zinc-600 hover:text-white text-xs gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Reimprimir factura
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
