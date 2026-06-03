import { useState, useCallback } from "react";

// WebUSB API type declarations (not in standard lib)
declare global {
  interface USBDevice {
    open(): Promise<void>;
    close(): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: ArrayBuffer | ArrayBufferView): Promise<USBOutTransferResult>;
    selectConfiguration(configurationValue: number): Promise<void>;
    configuration: { interfaces: USBInterface[] } | null;
    productName?: string;
    manufacturerName?: string;
  }
  interface USBInterface {
    interfaceNumber: number;
    alternate: { endpoints: USBEndpoint[] };
  }
  interface USBEndpoint {
    direction: "out" | "in";
    endpointNumber: number;
  }
  interface USBOutTransferResult {
    status: string;
  }
  interface USB {
    requestDevice(options: { filters: { vendorId?: number; classCode?: number }[] }): Promise<USBDevice>;
  }
  interface Navigator {
    usb: USB;
  }
}

const ESC = 0x1b;
const GS = 0x1d;
const NL = 0x0a;

const CMD = {
  init: [ESC, 0x40],
  alignLeft: [ESC, 0x61, 0x00],
  alignCenter: [ESC, 0x61, 0x01],
  alignRight: [ESC, 0x61, 0x02],
  boldOn: [ESC, 0x45, 0x01],
  boldOff: [ESC, 0x45, 0x00],
  doubleHeight: [GS, 0x21, 0x01],
  doubleWidth: [GS, 0x21, 0x10],
  doubleSize: [GS, 0x21, 0x11],
  normalSize: [GS, 0x21, 0x00],
  cut: [GS, 0x56, 0x42, 0x10],
  feed: (n: number) => [ESC, 0x64, n],
};

const LINE_WIDTH = 32;

function textBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes.push(code < 128 ? code : 63); // fallback '?' for non-ASCII
  }
  return bytes;
}

function padLine(left: string, right: string, width = LINE_WIDTH): string {
  const spaces = width - left.length - right.length;
  return left + " ".repeat(Math.max(1, spaces)) + right;
}

function centerStr(str: string, width = LINE_WIDTH): string {
  const pad = Math.max(0, Math.floor((width - str.length) / 2));
  return " ".repeat(pad) + str;
}

function divider(char = "-", width = LINE_WIDTH): string {
  return char.repeat(width);
}

export interface TicketData {
  mesa: string;
  pedidoId: number;
  items: Array<{ nombre: string; cantidad: number; precio: number; observaciones?: string }>;
  subtotal: number;
  propina: number;
  total: number;
  metodoPago: string;
  efectivoPagado?: number;
  cambio?: number;
  mesero?: string;
  fecha: Date;
}

export function buildEscPosTicket(data: TicketData): Uint8Array {
  const cmds: number[] = [];

  const push = (...seqs: number[][]) => seqs.forEach((s) => cmds.push(...s));
  const text = (str: string) => cmds.push(...textBytes(str));
  const nl = () => cmds.push(NL);

  // Init
  push(CMD.init);

  // Header
  push(CMD.alignCenter, CMD.boldOn, CMD.doubleSize);
  text("TIAMO BURGER"); nl();
  push(CMD.normalSize, CMD.boldOff);
  text("Sistema POS"); nl();
  text(divider("=")); nl();

  // Mesa + fecha
  push(CMD.alignLeft);
  const fecha = data.fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = data.fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  text(padLine(`Mesa: ${data.mesa}`, `Pedido #${data.pedidoId}`)); nl();
  text(padLine(`Fecha: ${fecha}`, hora)); nl();
  if (data.mesero) { text(`Mesero: ${data.mesero}`); nl(); }
  text(divider("-")); nl();

  // Items
  push(CMD.boldOn);
  text(padLine("PRODUCTO", "TOTAL")); nl();
  push(CMD.boldOff);
  text(divider("-")); nl();

  for (const item of data.items) {
    const itemTotal = item.cantidad * item.precio;
    const nameStr = item.cantidad > 1 ? `${item.cantidad}x ${item.nombre}` : item.nombre;
    const priceStr = `$${itemTotal.toLocaleString("es-CO")}`;
    // Truncate if too long
    const maxName = LINE_WIDTH - priceStr.length - 1;
    const displayName = nameStr.length > maxName ? nameStr.substring(0, maxName - 1) + "." : nameStr;
    text(padLine(displayName, priceStr)); nl();
    if (item.observaciones) {
      text(`  * ${item.observaciones.substring(0, LINE_WIDTH - 4)}`); nl();
    }
  }

  text(divider("-")); nl();

  // Totals
  const subtotalStr = `$${data.subtotal.toLocaleString("es-CO")}`;
  text(padLine("Subtotal:", subtotalStr)); nl();
  if (data.propina > 0) {
    const propinaStr = `$${data.propina.toLocaleString("es-CO")}`;
    text(padLine("Propina:", propinaStr)); nl();
  }

  push(CMD.boldOn);
  const totalStr = `$${data.total.toLocaleString("es-CO")}`;
  text(padLine("TOTAL:", totalStr)); nl();
  push(CMD.boldOff);

  const metodo = data.metodoPago === "efectivo" ? "Efectivo" : data.metodoPago === "transferencia" ? "Transferencia" : "Mixto";
  text(padLine("Pago:", metodo)); nl();

  if (data.efectivoPagado && data.efectivoPagado > 0) {
    text(padLine("Recibido:", `$${data.efectivoPagado.toLocaleString("es-CO")}`)); nl();
    const cambio = data.cambio ?? 0;
    text(padLine("Cambio:", `$${cambio.toLocaleString("es-CO")}`)); nl();
  }

  text(divider("=")); nl();
  push(CMD.alignCenter);
  text(centerStr("Gracias por su visita!")); nl();
  text(centerStr("3219600269")); nl();
  text(centerStr("@ti_amopizzas18")); nl();

  // Feed + cut
  push(CMD.feed(4));
  push(CMD.cut);

  return new Uint8Array(cmds);
}

interface PrinterState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  error: string | null;
}

export function useEscPosPrinter() {
  const [device, setDevice] = useState<USBDevice | null>(null);
  const [outEndpoint, setOutEndpoint] = useState<number | null>(null);
  const [state, setState] = useState<PrinterState>({
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    error: null,
  });

  const connect = useCallback(async () => {
    if (!("usb" in navigator)) {
      setState((s) => ({ ...s, error: "Web USB no disponible. Usa Chrome o Edge." }));
      return;
    }
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const dev = await (navigator as any).usb.requestDevice({
        filters: [{ classCode: 7 }],
      });
      await dev.open();
      if (dev.configuration === null) await dev.selectConfiguration(1);

      let ifaceNum = 0;
      let epNum = 1;
      for (const iface of dev.configuration?.interfaces ?? []) {
        for (const ep of iface.alternate.endpoints) {
          if (ep.direction === "out") {
            ifaceNum = iface.interfaceNumber;
            epNum = ep.endpointNumber;
            break;
          }
        }
      }
      await dev.claimInterface(ifaceNum);

      setDevice(dev);
      setOutEndpoint(epNum);
      setState({ isConnected: true, isConnecting: false, deviceName: dev.productName ?? "Impresora USB", error: null });
    } catch (e: any) {
      const msg = e.message ?? "Error al conectar";
      setState({ isConnected: false, isConnecting: false, deviceName: null, error: msg.includes("No device") ? "Sin selección" : msg });
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (device) {
      try { await device.close(); } catch { /* ignore */ }
    }
    setDevice(null);
    setOutEndpoint(null);
    setState({ isConnected: false, isConnecting: false, deviceName: null, error: null });
  }, [device]);

  const printRaw = useCallback(async (data: Uint8Array) => {
    if (!device || outEndpoint === null) throw new Error("Impresora no conectada");
    await device.transferOut(outEndpoint, data);
  }, [device, outEndpoint]);

  const printTicket = useCallback(async (ticketData: TicketData) => {
    const bytes = buildEscPosTicket(ticketData);
    await printRaw(bytes);
  }, [printRaw]);

  return { state, connect, disconnect, printRaw, printTicket };
}
