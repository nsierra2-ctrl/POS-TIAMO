import { useState, useCallback } from "react";

/**
 * Hook de impresion TIAMO POS - "Funcione si o si"
 *
 * Estrategia en cascada:
 * 1. Backend API  (/api/impresora/imprimir)  - imprime directo desde el servidor
 * 2. Bridge local (localhost:3001)            - para laptops con bridge.js
 * 3. WebUSB     (Chrome/Edge)                - conexion directa USB al navegador
 *
 * El usuario solo ve: "Imprimiendo..." o "OK / Error"
 */

const BRIDGE_URL = "http://localhost:3001";

interface PrinterState {
  isAvailable: boolean;
  isPrinting: boolean;
  mode: "backend" | "bridge" | "usb" | "simulado" | "none" | null;
  error: string | null;
}

export function useLocalPrinter() {
  const [state, setState] = useState<PrinterState>({
    isAvailable: false,
    isPrinting: false,
    mode: null,
    error: null,
  });

  /* ---------- 1. Backend API (canon) ---------- */
  const printViaBackend = useCallback(async (ticketTexto: string): Promise<{ ok: boolean; mensaje: string }> => {
    setState((s) => ({ ...s, isPrinting: true, error: null }));
    try {
      const res = await fetch("/api/impresora/imprimir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: ticketTexto, tipo: "pedido" }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setState((s) => ({
          ...s,
          isPrinting: false,
          isAvailable: true,
          mode: data.modo === "simulado" ? "simulado" : "backend",
        }));
        return { ok: true, mensaje: data.mensaje };
      }
      const msg = data.error || "Error de impresion desde servidor";
      setState((s) => ({ ...s, isPrinting: false, error: msg }));
      return { ok: false, mensaje: msg };
    } catch (e: any) {
      const msg = e.message || "Servidor no responde";
      setState((s) => ({ ...s, isPrinting: false, error: msg }));
      return { ok: false, mensaje: msg };
    }
  }, []);

  /* ---------- 2. Bridge local (fallback) ---------- */
  const detectBridge = useCallback(async (): Promise<boolean> => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(`${BRIDGE_URL}/health`, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) {
        setState((s) => ({ ...s, isAvailable: true, mode: "bridge", error: null }));
        return true;
      }
    } catch { /* no bridge */ }
    return false;
  }, []);

  const printViaBridge = useCallback(async (ticketTexto: string): Promise<{ ok: boolean; mensaje: string }> => {
    setState((s) => ({ ...s, isPrinting: true, error: null }));
    try {
      const res = await fetch(`${BRIDGE_URL}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: ticketTexto, mode: "text" }),
      });
      const data = await res.json();
      if (data.ok) {
        setState((s) => ({ ...s, isPrinting: false, isAvailable: true, mode: "bridge" }));
        return { ok: true, mensaje: `Impreso via puente local (${data.bytes} bytes)` };
      }
      setState((s) => ({ ...s, isPrinting: false, error: data.error }));
      return { ok: false, mensaje: data.error };
    } catch (e: any) {
      const msg = e.message || "Puente local no responde";
      setState((s) => ({ ...s, isPrinting: false, error: msg, isAvailable: false, mode: "none" }));
      return { ok: false, mensaje: msg };
    }
  }, []);

  /* ---------- 3. WebUSB (ultimo recurso) ---------- */
  const printViaUsb = useCallback(async (ticketTexto: string): Promise<{ ok: boolean; mensaje: string }> => {
    if (!("usb" in navigator)) {
      return { ok: false, mensaje: "WebUSB no disponible. Usa Chrome/Edge." };
    }
    try {
      const dev = await (navigator as any).usb.requestDevice({ filters: [{ classCode: 7 }] });
      await dev.open();
      if (dev.configuration === null) await dev.selectConfiguration(1);

      let ifaceNum = 0, epNum = 1;
      for (const iface of dev.configuration?.interfaces ?? []) {
        for (const ep of iface.alternate.endpoints) {
          if (ep.direction === "out") { ifaceNum = iface.interfaceNumber; epNum = ep.endpointNumber; break; }
        }
      }
      await dev.claimInterface(ifaceNum);
      const bytes = textToEscPos(ticketTexto);
      await dev.transferOut(epNum, bytes);
      try { await dev.close(); } catch { /* ignore */ }
      return { ok: true, mensaje: `Impreso via USB (${bytes.length} bytes)` };
    } catch (e: any) {
      return { ok: false, mensaje: e.message || "Error USB" };
    }
  }, []);

  /* ---------- Cascada principal ---------- */
  const print = useCallback(async (ticketTexto: string): Promise<{ ok: boolean; mensaje: string }> => {
    // 1. Intentar backend primero
    const backendRes = await printViaBackend(ticketTexto);
    if (backendRes.ok) return backendRes;

    // 2. Intentar bridge local
    const bridgeOk = await detectBridge();
    if (bridgeOk) {
      const bridgeRes = await printViaBridge(ticketTexto);
      if (bridgeRes.ok) return bridgeRes;
    }

    // 3. Fallback USB
    return printViaUsb(ticketTexto);
  }, [printViaBackend, detectBridge, printViaBridge, printViaUsb]);

  return { state, print, detectBridge };
}

// Generador ESC/POS simple para frontend (WebUSB)
function textToEscPos(text: string): Uint8Array {
  const ESC = 0x1b, GS = 0x1d, LF = 0x0a;
  const parts: number[] = [];
  parts.push(ESC, 0x40);
  parts.push(ESC, 0x74, 0x10);
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) { parts.push(LF); continue; }
    const centered =
      trimmed.startsWith("TIAMO") ||
      trimmed.startsWith("COMANDA") ||
      trimmed.startsWith("FACTURA") ||
      trimmed.startsWith("TICKET") ||
      trimmed.startsWith("\u00a1Gracias") ||
      trimmed.startsWith("www.");
    const divider = trimmed.startsWith("===");
    if (centered || divider) {
      parts.push(ESC, 0x61, 0x01);
      parts.push(...toLatin1Bytes(trimmed));
      parts.push(LF);
      parts.push(ESC, 0x61, 0x00);
    } else {
      parts.push(...toLatin1Bytes(trimmed));
      parts.push(LF);
    }
  }
  parts.push(ESC, 0x64, 0x04);
  parts.push(GS, 0x56, 0x01);
  return new Uint8Array(parts);
}

function toLatin1Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c === 241) bytes.push(0xf1);
    else if (c === 209) bytes.push(0xd1);
    else if (c === 225) bytes.push(0xe1);
    else if (c === 233) bytes.push(0xe9);
    else if (c === 237) bytes.push(0xed);
    else if (c === 243) bytes.push(0xf3);
    else if (c === 250) bytes.push(0xfa);
    else if (c === 193) bytes.push(0xc1);
    else if (c === 201) bytes.push(0xc9);
    else if (c === 205) bytes.push(0xcd);
    else if (c === 211) bytes.push(0xd3);
    else if (c === 218) bytes.push(0xda);
    else if (c === 161) bytes.push(0xa1);
    else if (c === 191) bytes.push(0xbf);
    else if (c >= 0x80 && c <= 0xff) bytes.push(c);
    else bytes.push(0x3f);
  }
  return bytes;
}
