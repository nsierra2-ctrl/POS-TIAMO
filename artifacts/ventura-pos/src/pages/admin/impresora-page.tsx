import { useState, useCallback, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import {
  useGetImpresoraConfig,
  useSetImpresoraConfig,
  useGetImpresoraLogs,
  useImprimirPrueba,
  useLimpiarImpresoraLogs,
  getGetImpresoraConfigQueryKey,
  getGetImpresoraLogsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Printer, CheckCircle2, XCircle, Trash2, RefreshCw, Settings,
  FileText, Usb, Wifi, Globe, Zap, AlertTriangle, PlugZap,
  Eye, Receipt, Search, Check
} from "lucide-react";
import { useEscPosPrinter, buildEscPosTicket } from "@/hooks/use-escpos-printer";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type ModoImpresora = "simulado" | "usb" | "wifi" | "ethernet" | "bluetooth";
const VALID_MODES: ModoImpresora[] = ["simulado", "usb", "wifi", "ethernet", "bluetooth"];

export default function ImpresoraPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config } = useGetImpresoraConfig({
    query: { queryKey: getGetImpresoraConfigQueryKey() },
  });
  const { data: logs } = useGetImpresoraLogs({
    query: { queryKey: getGetImpresoraLogsQueryKey(), refetchInterval: 8000 },
  });

  const configMutation = useSetImpresoraConfig();
  const pruebaMutation = useImprimirPrueba();
  const limpiarMutation = useLimpiarImpresoraLogs();

  // Estado local - default Ethernet para JAL-P58
  const [modo, setModo] = useState<ModoImpresora>("ethernet");
  const [ip, setIp] = useState("192.168.1.100");
  const [puerto, setPuerto] = useState("9100");
  const [ssid, setSsid] = useState("");
  const [bluetoothName, setBluetoothName] = useState("");
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [showFacturaPreview, setShowFacturaPreview] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState("TIAMO BURGER");
  const [pieFactura, setPieFactura] = useState("\u00a1Gracias por su visita!");
  const [detectando, setDetectando] = useState(false);
  const [probandoIp, setProbandoIp] = useState(false);

  const { state: usbState, connect: connectUsb, disconnect: disconnectUsb, printRaw } = useEscPosPrinter();

  useEffect(() => {
    if (config) {
      const m = VALID_MODES.includes(config.modo as any) ? (config.modo as ModoImpresora) : "simulado";
      setModo(m);
      setIp(config.ip || "");
      setPuerto(config.puerto?.toString() || "9100");
      setSsid((config as any).ssid || "");
      setBluetoothName((config as any).bluetoothName || "");
    }
  }, [config]);

  const handleGuardar = async () => {
    try {
      await configMutation.mutateAsync({
        data: {
          modo: modo as any,
          ip: (modo === "wifi" || modo === "ethernet") ? (ip || undefined) : undefined,
          puerto: (modo === "wifi" || modo === "ethernet") ? (puerto ? parseInt(puerto) : undefined) : undefined,
          ssid: modo === "wifi" ? (ssid || undefined) : undefined,
          bluetoothName: modo === "bluetooth" ? (bluetoothName || undefined) : undefined,
        } as any,
      });
      queryClient.invalidateQueries({ queryKey: getGetImpresoraConfigQueryKey() });
      toast({ title: "Configuraci\u00f3n guardada" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleDetectar = async () => {
    setDetectando(true);
    try {
      const res = await fetch("/api/impresora/detectar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subnet: ip.split(".").slice(0, 3).join("."), start: 1, end: 254, puerto: parseInt(puerto) || 9100 }),
      });
      const data = await res.json();
      if (data.ok) {
        setIp(data.ip);
        setPuerto(String(data.puerto));
        toast({ title: "\u00a1Impresora detectada!", description: `${data.ip}:${data.puerto} (${data.ms}ms). Configuración guardada automaticamente.` });
        queryClient.invalidateQueries({ queryKey: getGetImpresoraConfigQueryKey() });
      } else {
        toast({
          title: "No se detectó impresora",
          description: data.tip || "Verifique que la impresora esté encendida y en la misma red.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Error de detección", description: e.message, variant: "destructive" });
    } finally {
      setDetectando(false);
    }
  };

  const handleProbarIp = async () => {
    if (!ip) { toast({ title: "Ingrese una IP", variant: "destructive" }); return; }
    setProbandoIp(true);
    try {
      const res = await fetch("/api/impresora/probar-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, puerto: parseInt(puerto) || 9100 }),
      });
      const data = await res.json();
      if (data.ok) {
        toast({ title: "\u00a1Conexión exitosa!", description: data.message });
      } else {
        toast({ title: "No se pudo conectar", description: data.tip || data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProbandoIp(false);
    }
  };

  const handlePrueba = async () => {
    if (modo === "usb" && !usbState.isConnected) {
      toast({ title: "Conecta la impresora USB primero", variant: "destructive" });
      return;
    }
    if (modo === "usb" && usbState.isConnected) {
      // Imprimir via USB directo
      try {
        const bytes = buildEscPosTicket({
          mesa: "01",
          pedidoId: 999,
          items: [
            { nombre: "Tiamo Burger", cantidad: 2, precio: 34000 },
            { nombre: "Coca-Cola Pet 400", cantidad: 2, precio: 5000 },
          ],
          subtotal: 78000,
          propina: 0,
          total: 78000,
          metodoPago: "efectivo",
          efectivoPagado: 100000,
          cambio: 22000,
          mesero: "Mesero Demo",
          fecha: new Date(),
        });
        await printRaw(bytes);
        setTicketPreview("TICKET IMPRESO POR USB\nVerifica la impresora f\u00edsica.");
        toast({ title: "Ticket enviado a impresora USB" });
        return;
      } catch (e: any) {
        toast({ title: "Error USB", description: e.message, variant: "destructive" });
        return;
      }
    }
    try {
      const r = await pruebaMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getGetImpresoraLogsQueryKey() });
      if (r.ticket) setTicketPreview(r.ticket);
      if (r.ok) {
        toast({ title: "Prueba completada", description: r.mensaje || r.modo === "simulado" ? "Ticket mostrado en preview. Conecta una impresora real para imprimir fisicamente." : "" });
      } else {
        const isSimulado = config?.modo === "simulado";
        const isNoPrinter = r.error?.includes("Timeout") || r.error?.includes("conecte");
        toast({
          title: isNoPrinter && !isSimulado ? "Sin impresora conectada" : "Error de impresion",
          description: isNoPrinter && !isSimulado
            ? `No se encontro impresora JAL-P58 en ${config?.ip}:${config?.puerto}. Verifica: (1) Impresora encendida, (2) Cable de red conectado, (3) IP correcta en el ticket Selftest.`
            : (r.error || "Error desconocido"),
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({ title: "Error en prueba", description: e?.message || "No se pudo conectar con la impresora", variant: "destructive" });
    }
  };

  const handleLimpiar = async () => {
    await limpiarMutation.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getGetImpresoraLogsQueryKey() });
    setTicketPreview(null);
    toast({ title: "Logs limpiados" });
  };

  // Preview de factura
  const facturaDemo = `================================
         ${nombreNegocio}
         NIT: 900.XXX.XXX-X
   Calle 10 # 5-30, Centro
        Tel: 3219600269
================================
         FACTURA DE VENTA
      No. 000001 - Mesa 3
================================
Fecha: ${new Date().toLocaleString("es-CO")}
Mesero: Ingrid
================================
CANT  DESCRIPCI\u00d3N              VALOR
--------------------------------
  2   Tiamo Burger          $34.000
  1   Papas Locas           $31.000
  2   Coca-Cola 400ml       $10.000
  1   Granizada Mandarina   $11.000
--------------------------------
SUBTOTAL:                    $86.000
PROPINA (10%):               $8.600
--------------------------------
TOTAL:                       $94.600
--------------------------------
Metodo: EFECTIVO
Efectivo:                   $100.000
Cambio:                      $5.400
================================
${pieFactura}
     TIAMO BURGER POS v2.0
================================`;

  const MODO_OPTIONS = [
    { id: "simulado" as ModoImpresora, label: "Simulado (PDF/Preview)", icon: FileText, desc: "Guarda tickets en logs, muestra preview en pantalla. Sin impresora f\u00edsica." },
    { id: "usb" as ModoImpresora, label: "USB Directo", icon: Usb, desc: "Conecta impresora t\u00e9rmica via USB usando WebUSB (Chrome/Edge)." },
    { id: "wifi" as ModoImpresora, label: "WiFi / Red", icon: Wifi, desc: "Impresora con WiFi en la misma red local. Configura IP y puerto." },
    { id: "ethernet" as ModoImpresora, label: "Ethernet (Cable)", icon: Globe, desc: "Impresora con cable de red RJ45. IP fija en la red local." },
    { id: "bluetooth" as ModoImpresora, label: "Bluetooth", icon: Zap, desc: "Impresora port\u00e1til con Bluetooth. Selecciona dispositivo emparejado." },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20 md:pb-0">
      <Navigation />

      <main className="p-4 md:p-8 max-w-screen-xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight font-display">Impresora & Facturaci\u00f3n</h1>
          <p className="text-zinc-500 text-sm mt-1">Configura impresoras t\u00e9rmicas, WiFi, USB o Bluetooth. Preview de factura incluido.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Config Panel */}
          <div className="rounded-2xl border border-white/5 p-6 space-y-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm">Modo de Conexi\u00f3n</span>
            </div>

            <div className="space-y-2">
              {MODO_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = modo === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setModo(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 ${
                      active ? "border-red-500/40 bg-red-500/8" : "border-white/5 bg-white/2 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-red-500/20" : "bg-white/5"}`}>
                        <Icon className={`w-4 h-4 ${active ? "text-red-400" : "text-zinc-500"}`} />
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${active ? "text-white" : "text-zinc-400"}`}>{opt.label}</div>
                        <div className="text-xs text-zinc-600">{opt.desc}</div>
                      </div>
                      {active && <div className="ml-auto w-2 h-2 rounded-full bg-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* USB Panel */}
            {modo === "usb" && (
              <div className="p-4 rounded-xl border space-y-3" style={{ background: usbState.isConnected ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.03)", borderColor: usbState.isConnected ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${usbState.isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
                    <span className="text-sm font-bold text-white">{usbState.isConnected ? usbState.deviceName : "Sin conexi\u00f3n USB"}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={usbState.isConnected ? disconnectUsb : connectUsb} disabled={usbState.isConnecting}
                    className={`text-xs font-bold border ${usbState.isConnected ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-white/10 text-zinc-400 hover:text-white"}`}>
                    {usbState.isConnecting ? <div className="w-3 h-3 animate-spin rounded-full border border-white/30 border-t-white mr-1" /> : <PlugZap className="w-3 h-3 mr-1" />}
                    {usbState.isConnected ? "Desconectar" : "Conectar USB"}
                  </Button>
                </div>
                {usbState.error && <div className="flex items-center gap-2 text-amber-400 text-xs"><AlertTriangle className="w-3 h-3 shrink-0" />{usbState.error}</div>}
                {!usbState.isConnected && !usbState.error && <p className="text-xs text-zinc-600">Haz clic en "Conectar USB" y selecciona la impresora de la lista. Requiere Chrome o Edge con WebUSB.</p>}
              </div>
            )}

            {/* WiFi / Ethernet Panel */}
            {(modo === "wifi" || modo === "ethernet") && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">IP de la impresora</label>
                  <div className="flex gap-2">
                    <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.100" className="flex-1 bg-white/5 border-white/10 text-white" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-bold gap-1"
                      onClick={handleProbarIp}
                      disabled={probandoIp || !ip}
                    >
                      {probandoIp ? <div className="w-3 h-3 animate-spin rounded-full border border-white/30 border-t-white" /> : <Check className="w-3.5 h-3.5" />}
                      Probar IP
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Puerto (default 9100)</label>
                  <Input value={puerto} onChange={(e) => setPuerto(e.target.value)} placeholder="9100" className="bg-white/5 border-white/10 text-white" />
                </div>
                {modo === "wifi" && (
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Nombre de red (SSID) - opcional</label>
                    <Input value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="MiRedWiFi" className="bg-white/5 border-white/10 text-white" />
                  </div>
                )}

                {/* Boton detectar automatico */}
                <Button
                  variant="outline"
                  className="w-full border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400 text-xs font-bold gap-2 h-10"
                  onClick={handleDetectar}
                  disabled={detectando}
                >
                  {detectando ? <div className="w-4 h-4 animate-spin rounded-full border border-emerald-500/30 border-t-emerald-400" /> : <Search className="w-4 h-4" />}
                  {detectando ? "Buscando en la red..." : "Detectar impresora automaticamente"}
                </Button>

                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs text-blue-300">\u2139 Si no sabe la IP, use "Detectar automaticamente". La impresora debe estar encendida y en la misma red. Puerto tipico: 9100.</p>
                </div>
              </div>
            )}

            {/* Bluetooth Panel */}
            {modo === "bluetooth" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Nombre del dispositivo Bluetooth</label>
                  <Input value={bluetoothName} onChange={(e) => setBluetoothName(e.target.value)} placeholder="JP-58D" className="bg-white/5 border-white/10 text-white" />
                </div>
                <p className="text-xs text-zinc-600">Empareja la impresora en el sistema operativo primero. Luego selecciona aqu\u00ed.</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleGuardar} disabled={configMutation.isPending} className="flex-1 font-bold text-sm" style={{ background: "linear-gradient(135deg,#FF2D2D,#CC0000)" }}>
                Guardar Config
              </Button>
              <Button onClick={handlePrueba} disabled={pruebaMutation.isPending || (modo === "usb" && !usbState.isConnected)} variant="outline" className="flex-1 border-white/10 font-bold hover:bg-white/5 text-white text-sm gap-2">
                <Zap className="w-3.5 h-3.5" />
                Imprimir Prueba
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="rounded-2xl border border-white/5 p-6 space-y-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-sm">Vista Previa</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setShowFacturaPreview(false)} className={`px-2 py-1 rounded-lg text-xs font-bold ${!showFacturaPreview ? "bg-blue-500/20 text-blue-300" : "text-zinc-600"}`}>Ticket</button>
                <button onClick={() => setShowFacturaPreview(true)} className={`px-2 py-1 rounded-lg text-xs font-bold ${showFacturaPreview ? "bg-blue-500/20 text-blue-300" : "text-zinc-600"}`}>Factura</button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 overflow-auto max-h-[420px] shadow-inner">
              <pre className="text-black font-mono text-[11px] whitespace-pre leading-tight">
                {showFacturaPreview ? facturaDemo : (ticketPreview ?? "Presiona \"Imprimir Prueba\" para ver el ticket de prueba aqu\u00ed.")}
              </pre>
            </div>

            {/* Personalizaci\u00f3n de factura */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Personalizaci\u00f3n de Factura</span>
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Nombre del negocio</label>
                <Input value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm h-8" />
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Pie de factura</label>
                <Input value={pieFactura} onChange={(e) => setPieFactura(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm h-8" />
              </div>
            </div>

            {/* Info impresora - TODOS los parametros */}
            <div className="p-3 rounded-xl bg-white/2 border border-white/5 space-y-1.5">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Configuracion Actual</div>
              <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">Modo</span><span className="text-white font-medium">{modo.toUpperCase()}</span></div>
              {(modo === "wifi" || modo === "ethernet") && (
                <>
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">IP</span><span className="text-white font-mono">{ip || "No configurada"}</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">Puerto</span><span className="text-white font-mono">{puerto}</span></div>
                  {modo === "wifi" && <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">SSID</span><span className="text-white font-medium">{ssid || "-"}</span></div>}
                </>
              )}
              {modo === "bluetooth" && (
                <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">Dispositivo</span><span className="text-white font-medium">{bluetoothName || "No seleccionado"}</span></div>
              )}
              {modo === "usb" && (
                <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">Dispositivo USB</span><span className="text-white font-medium">{usbState.isConnected ? (usbState.deviceName || "Conectado") : "Sin conexion"}</span></div>
              )}
              <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">Modelo</span><span className="text-white font-medium">JAL-P58 / TM-T20 (58mm)</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">Protocolo</span><span className="text-white font-medium">ESC/POS</span></div>
              <div className="flex items-center justify-between text-xs"><span className="text-zinc-600">Estado</span>
                <span className={`font-bold ${usbState.isConnected ? "text-emerald-400" : config?.modo === "simulado" ? "text-blue-400" : modo === "wifi" || modo === "ethernet" ? (ip ? "text-amber-400" : "text-red-400") : "text-zinc-500"}`}>
                  {usbState.isConnected ? "Conectada (USB)" : config?.modo === "simulado" ? "Simulando (Preview)" : modo === "wifi" || modo === "ethernet" ? (ip ? "Configurada (red)" : "Falta IP/Puerto") : "Configurada"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-500" />
              <span className="font-bold text-sm">Historial de impresiones</span>
              <span className="text-xs text-zinc-600 ml-1">({logs?.length ?? 0})</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => queryClient.invalidateQueries({ queryKey: getGetImpresoraLogsQueryKey() })} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
              <button onClick={handleLimpiar} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
            {(logs ?? []).map((log: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-white/2 transition-colors">
                {log.exito ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white capitalize">{log.tipo}</span>
                    <span className="text-[10px] text-zinc-600">{new Date(log.ts).toLocaleString("es-CO")}</span>
                    <span className={`ml-auto text-[10px] font-bold ${log.exito ? "text-emerald-500" : "text-red-500"}`}>{log.exito ? "OK" : "ERROR"}</span>
                  </div>
                  <pre className="text-[10px] text-zinc-500 truncate font-mono">{log.contenido.substring(0, 120)}…</pre>
                </div>
              </div>
            ))}
            {!logs?.length && <div className="py-10 text-center text-zinc-700 text-sm">Sin registros de impresi\u00f3n</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
