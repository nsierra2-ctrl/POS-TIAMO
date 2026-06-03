import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCobrarPedido, getGetPedidosQueryKey, getGetMesasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/constants";
import { Banknote, CreditCard, Split, Check, AlertCircle, Printer, Receipt, FileText, Usb } from "lucide-react";
import { useLocalPrinter } from "@/hooks/use-local-printer";

type MetodoPago = "efectivo" | "transferencia" | "mixto";

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

const PROPINAS_SUGERIDAS = [
  { label: "Sin propina", valor: 0 },
  { label: "5%", pct: 5 },
  { label: "10%", pct: 10 },
  { label: "15%", pct: 15 },
];

const BILLETES_COMUNES = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

export function CobrarModal({ pedido, open, onClose }: CobrarModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cobrarMutation = useCobrarPedido();
  const localPrinter = useLocalPrinter();

  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [propinaPct, setPropinaPct] = useState<number | null>(0);
  const [propinaCustom, setPropinaCustom] = useState("");
  const [efectivoStr, setEfectivoStr] = useState("");
  const [transferenciaStr, setTransferenciaStr] = useState("");
  const [resultado, setResultado] = useState<{ cambio: number } | null>(null);
  const [exito, setExito] = useState(false);
  const [facturaTicket, setFacturaTicket] = useState<string | null>(null);
  const [impresionResult, setImpresionResult] = useState<{ ok: boolean; mensaje: string } | null>(null);
  const [facturaImpresa, setFacturaImpresa] = useState(false);

  const total = pedido?.total ?? 0;

  const propina = (() => {
    if (propinaPct !== null) return Math.round(total * propinaPct / 100);
    const v = parseInt(propinaCustom.replace(/\D/g, "") || "0");
    return isNaN(v) ? 0 : v;
  })();

  const totalConPropina = total + propina;

  const efectivo = parseInt(efectivoStr.replace(/\D/g, "") || "0") || 0;
  const transferencia = parseInt(transferenciaStr.replace(/\D/g, "") || "0") || 0;

  const montoPagado = metodo === "efectivo" ? efectivo
    : metodo === "transferencia" ? transferencia
    : efectivo + transferencia;

  const cambio = metodo === "efectivo" ? Math.max(0, efectivo - totalConPropina) : 0;
  const faltante = Math.max(0, totalConPropina - montoPagado);

  useEffect(() => {
    if (!open) {
      setMetodo("efectivo");
      setPropinaPct(0);
      setPropinaCustom("");
      setEfectivoStr("");
      setTransferenciaStr("");
      setResultado(null);
      setExito(false);
      setFacturaTicket(null);
      setImpresionResult(null);
      setFacturaImpresa(false);
    }
  }, [open]);

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num ? parseInt(num).toLocaleString("es-CO") : "";
  };

  const handleCobrar = async () => {
    if (!pedido) return;
    if (faltante > 0) {
      toast({ title: "Monto insuficiente", description: `Faltan ${formatPrice(faltante)}`, variant: "destructive" });
      return;
    }

    const pagos = metodo === "efectivo"
      ? [{ metodo: "efectivo" as const, monto: Math.min(efectivo, totalConPropina) }]
      : metodo === "transferencia"
      ? [{ metodo: "transferencia" as const, monto: totalConPropina }]
      : [
          ...(efectivo > 0 ? [{ metodo: "efectivo" as const, monto: efectivo }] : []),
          ...(transferencia > 0 ? [{ metodo: "transferencia" as const, monto: transferencia }] : []),
        ];

    try {
      const r = await cobrarMutation.mutateAsync({ id: pedido.id, data: { pagos, propina, nota: `Cobrado en caja` } });
      setResultado({ cambio: r.cambio ?? 0 });
      const ft = (r as any).facturaTicket ?? null;
      const imp = (r as any).impresion ?? null;
      setFacturaTicket(ft);
      setImpresionResult(imp);
      setExito(true);
      queryClient.invalidateQueries({ queryKey: getGetPedidosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMesasQueryKey() });
      toast({ title: "\u00a1Cobrado con \u00e9xito!", description: `Mesa ${pedido.mesa} \u2014 ${formatPrice(totalConPropina)}` });
      // onSuccess NO se llama aquí — el modal debe quedar abierto
      // para que el mesero confirme e imprima la factura manualmente
    } catch (e: any) {
      toast({ title: "Error al cobrar", description: e?.message ?? "Error desconocido", variant: "destructive" });
    }
  };

  const imprimirFactura = (autoPrint = true) => {
    if (!facturaTicket) return;
    const win = window.open("", "_blank", "width=420,height=700");
    if (!win) {
      toast({ title: "Permita ventanas emergentes", description: "El navegador bloqueo la ventana de impresion", variant: "destructive" });
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura TIAMO BURGER</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px;background:#fff;color:#000}
      .c{text-align:center}.t{font-size:16px;font-weight:bold}.d{border-top:1px dashed #000;margin:5px 0}
      pre{white-space:pre;font-size:11px;line-height:1.3}
      @media print{@page{margin:0}body{padding:4px}}
    </style></head><body>
      <pre>${facturaTicket.replace(/</g, "&lt;")}</pre>
      <script>window.onload=()=>{${autoPrint ? 'setTimeout(()=>{window.print();},300);' : ''}}</script>
    </body></html>`);
    win.document.close();
  };

  const abrirFacturaHtml = () => {
    if (!pedido) return;
    const win = window.open(`${window.location.origin}/api/pedidos/${pedido.id}/factura?autoprint=1`, "_blank");
    if (!win) {
      toast({ title: "Permita ventanas emergentes para imprimir", variant: "destructive" });
    }
  };

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={`${exito ? "sm:max-w-md" : "sm:max-w-lg"} bg-[#111] border-white/10 text-white p-0 overflow-hidden`}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Banknote className="w-5 h-5" style={{ color: "#FF2D2D" }} />
            {exito ? `Factura \u2014 Mesa ${pedido.mesa}` : `Cobrar \u2014 Mesa ${pedido.mesa}`}
          </DialogTitle>
        </DialogHeader>

        {exito ? (
          <div className="flex flex-col px-6 pb-6 pt-4 gap-4">
            {/* Paso 1: Pago exitoso */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">\u00a1Pago registrado!</div>
                <div className="text-xs text-zinc-500">Mesa {pedido.mesa} liberada</div>
              </div>
              {resultado && resultado.cambio > 0 && (
                <div className="ml-auto text-right">
                  <div className="text-[10px] text-emerald-400/70 font-bold uppercase">Cambio</div>
                  <div className="text-lg font-black font-mono text-emerald-400">{formatPrice(resultado.cambio)}</div>
                </div>
              )}
            </div>

            {/* Paso 2: Vista previa de la factura */}
            {facturaTicket && !facturaImpresa && (
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/3 border-b border-white/5">
                  <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-500">Vista Previa - Factura del Cliente</span>
                </div>
                <div className="bg-white p-3 overflow-auto max-h-[240px]">
                  <pre className="text-black font-mono text-[11px] whitespace-pre leading-tight">{facturaTicket}</pre>
                </div>
              </div>
            )}

            {/* Paso 3: Confirmar e imprimir (solo antes de imprimir) */}
            {!facturaImpresa && (
              <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Confirme e imprima la factura</p>

                {/* Boton principal: Confirmar e imprimir TODO */}
                <Button
                  className="w-full h-12 font-bold text-sm gap-2"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                  onClick={async () => {
                    if (!facturaTicket) return;
                    // Imprimir fisica
                    const res = await localPrinter.print(facturaTicket);
                    if (res.ok) {
                      toast({ title: "Factura impresa", description: res.mensaje });
                    }
                    // Imprimir web
                    imprimirFactura(true);
                    setFacturaImpresa(true);
                  }}
                  disabled={localPrinter.state.isPrinting}
                >
                  {localPrinter.state.isPrinting ? (
                    <div className="w-4 h-4 animate-spin rounded-full border border-white/30 border-t-white mr-1" />
                  ) : (
                    <Printer className="w-5 h-5" />
                  )}
                  {localPrinter.state.isPrinting ? "Imprimiendo..." : "Confirmar e Imprimir Factura"}
                </Button>

                {/* Estado impresora */}
                <div className="flex items-center justify-between text-[10px] text-zinc-600">
                  <span>Impresora: {localPrinter.state.mode === "bridge" ? "Puente detectado" : localPrinter.state.mode === "usb" ? "USB conectado" : "Sin conexion"}</span>
                  <span>{localPrinter.state.isPrinting ? "Imprimiendo..." : "Lista"}</span>
                </div>
              </div>
            )}

            {/* Ya impreso - resumen + reimprimir */}
            {facturaImpresa && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-emerald-500/8 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-bold">Factura impresa exitosamente</span>
                </div>

                {/* Reimprimir opciones */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-white text-xs h-10 gap-1.5"
                    onClick={() => imprimirFactura(true)}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Reimprimir Web
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-white text-xs h-10 gap-1.5"
                    onClick={async () => {
                      if (!facturaTicket) return;
                      const res = await localPrinter.print(facturaTicket);
                      if (res.ok) toast({ title: "Reimpresa", description: res.mensaje });
                      else toast({ title: "No se pudo reimprimir", description: res.mensaje, variant: "destructive" });
                    }}
                    disabled={localPrinter.state.isPrinting}
                  >
                    <Usb className="w-3.5 h-3.5" />
                    Reimpr. Fisica
                  </Button>
                </div>
              </div>
            )}

            <Button className="w-full h-12 font-bold" onClick={onClose} style={{ background: "linear-gradient(135deg,#FF2D2D,#CC0000)" }}>
              Cerrar y Volver a Mesas
            </Button>
          </div>
        ) : (
          <div className="px-6 pb-6 pt-4 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center py-3 px-4 rounded-xl border border-white/5 bg-white/3">
              <span className="text-zinc-400 font-semibold text-sm">Total pedido</span>
              <span className="text-2xl font-black font-mono text-white">{formatPrice(total)}</span>
            </div>

            {/* Propina */}
            <div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Propina</div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {PROPINAS_SUGERIDAS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setPropinaPct(p.pct ?? 0); setPropinaCustom(""); }}
                    className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                      propinaPct === (p.pct ?? 0)
                        ? "border-red-500/50 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-white/3 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Monto manual propina"
                value={propinaCustom}
                onChange={(e) => { setPropinaCustom(formatInput(e.target.value)); setPropinaPct(null); }}
                className="bg-white/3 border-white/10 text-white placeholder:text-zinc-600 h-9"
              />
              {propina > 0 && (
                <div className="text-xs text-emerald-400 mt-1.5 font-semibold">Propina: {formatPrice(propina)}</div>
              )}
            </div>

            {/* M\u00e9todo */}
            <div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Forma de pago</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "efectivo", label: "Efectivo", icon: Banknote },
                  { key: "transferencia", label: "Transferencia", icon: CreditCard },
                  { key: "mixto", label: "Mixto", icon: Split },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setMetodo(key as MetodoPago)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all ${
                      metodo === key
                        ? "border-red-500/50 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-white/3 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            {(metodo === "efectivo" || metodo === "mixto") && (
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Efectivo recibido</div>
                <Input
                  placeholder="Monto efectivo"
                  value={efectivoStr}
                  onChange={(e) => setEfectivoStr(formatInput(e.target.value))}
                  className="bg-white/3 border-white/10 text-white placeholder:text-zinc-600"
                />
                {metodo === "efectivo" && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BILLETES_COMUNES.filter((b) => b >= totalConPropina && b <= totalConPropina * 2.5).slice(0, 4).map((b) => (
                      <button
                        key={b}
                        onClick={() => setEfectivoStr(b.toLocaleString("es-CO"))}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 hover:bg-white/10 transition-colors"
                      >
                        {formatPrice(b)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(metodo === "transferencia" || metodo === "mixto") && (
              <div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Transferencia</div>
                <Input
                  placeholder="Monto transferencia"
                  value={transferenciaStr}
                  onChange={(e) => setTransferenciaStr(formatInput(e.target.value))}
                  className="bg-white/3 border-white/10 text-white placeholder:text-zinc-600"
                />
              </div>
            )}

            {/* Resumen */}
            <div className="rounded-xl border border-white/5 p-4 space-y-2 bg-white/2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="font-mono font-bold">{formatPrice(total)}</span>
              </div>
              {propina > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Propina</span>
                  <span className="font-mono font-bold text-emerald-400">+{formatPrice(propina)}</span>
                </div>
              )}
              <div className="border-t border-white/5 pt-2 flex justify-between">
                <span className="font-bold text-white">Total a cobrar</span>
                <span className="font-black text-xl font-mono" style={{ color: "#FF2D2D" }}>{formatPrice(totalConPropina)}</span>
              </div>
              {montoPagado > 0 && metodo === "efectivo" && cambio > 0 && (
                <div className="flex justify-between text-sm text-emerald-400 font-bold">
                  <span>Cambio</span>
                  <span className="font-mono">{formatPrice(cambio)}</span>
                </div>
              )}
              {faltante > 0 && montoPagado > 0 && (
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Faltan {formatPrice(faltante)}
                </div>
              )}
            </div>

            <Button
              onClick={handleCobrar}
              disabled={cobrarMutation.isPending || (montoPagado < totalConPropina && (metodo !== "transferencia"))}
              className="w-full h-12 font-black text-base"
              style={{ background: "linear-gradient(135deg,#FF2D2D 0%,#CC0000 100%)" }}
            >
              {cobrarMutation.isPending ? "Procesando..." : `Cobrar ${formatPrice(totalConPropina)}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
