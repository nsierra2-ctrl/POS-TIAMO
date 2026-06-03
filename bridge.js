#!/usr/bin/env node
/**
 * Puente local TIAMO POS -> Impresora JAL-P58 Ethernet
 *
 * Este script corre en tu laptop y recibe tickets HTTP del frontend,
 * luego los envia via TCP raw a la impresora termica en IP:9100.
 *
 * USO:
 *   1. Instala Node.js en tu laptop
 *   2. Corre: node bridge.js
 *   3. El frontend detectara automaticamente el puente en localhost:3001
 *
 * Si tu impresora tiene IP diferente, edita PRINTER_IP abajo.
 */

const http = require("http");
const net = require("net");
const url = require("url");

// ========== CONFIGURA AQUI ==========
const PRINTER_IP = process.env.PRINTER_IP || "192.168.1.100";
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || "9100");
const BRIDGE_PORT = parseInt(process.env.BRIDGE_PORT || "3001");
// ====================================

function log(...args) {
  const ts = new Date().toLocaleTimeString("es-CO");
  console.log(`[${ts}]`, ...args);
}

function sendToPrinter(data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(8000);

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Timeout: impresora no responde. Verifica que este encendida."));
    });

    socket.on("error", (err) => {
      reject(err);
    });

    socket.connect(PRINTER_PORT, PRINTER_IP, () => {
      log(`Conectado a impresora ${PRINTER_IP}:${PRINTER_PORT}`);
      socket.write(data, (err) => {
        if (err) {
          socket.destroy();
          reject(err);
          return;
        }
        socket.end();
        resolve();
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers para que el frontend pueda hablar con localhost
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Health check
  if (parsedUrl.pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, printer: `${PRINTER_IP}:${PRINTER_PORT}`, bridge: `localhost:${BRIDGE_PORT}` }));
    return;
  }

  // Print endpoint
  if (parsedUrl.pathname === "/print" && req.method === "POST") {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { ticket, mode = "text" } = JSON.parse(body);
        if (!ticket) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Falta ticket" }));
          return;
        }

        let data;
        if (mode === "base64") {
          // Recibe bytes ESC/POS en base64
          data = Buffer.from(ticket, "base64");
        } else {
          // Recibe texto plano, convertir a ESC/POS
          data = textToEscPos(ticket);
        }

        log(`Enviando ${data.length} bytes a impresora...`);
        await sendToPrinter(data);
        log(`Impreso OK (${data.length} bytes)`);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, bytes: data.length, printer: `${PRINTER_IP}:${PRINTER_PORT}` }));
      } catch (e) {
        log("ERROR:", e.message);
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// Generador ESC/POS simple (misma logica que el backend)
function textToEscPos(text) {
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;
  const parts = [];

  // Init + codepage CP850
  parts.push(Buffer.from([ESC, 0x40]));
  parts.push(Buffer.from([ESC, 0x74, 0x10]));

  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      parts.push(Buffer.from([LF]));
      continue;
    }
    if (
      trimmed.startsWith("TIAMO") ||
      trimmed.startsWith("COMANDA") ||
      trimmed.startsWith("FACTURA") ||
      trimmed.startsWith("TICKET") ||
      trimmed.startsWith("¡Gracias") ||
      trimmed.startsWith("www.")
    ) {
      parts.push(Buffer.from([ESC, 0x61, 0x01])); // center
      parts.push(toLatin1(trimmed));
      parts.push(Buffer.from([LF]));
      parts.push(Buffer.from([ESC, 0x61, 0x00])); // left
    } else if (trimmed.startsWith("===")) {
      parts.push(Buffer.from([ESC, 0x61, 0x01]));
      parts.push(toLatin1(trimmed));
      parts.push(Buffer.from([LF]));
      parts.push(Buffer.from([ESC, 0x61, 0x00]));
    } else {
      parts.push(toLatin1(trimmed));
      parts.push(Buffer.from([LF]));
    }
  }

  // Feed + cut
  parts.push(Buffer.from([ESC, 0x64, 0x04])); // feed 4 lines
  parts.push(Buffer.from([GS, 0x56, 0x01])); // partial cut

  return Buffer.concat(parts);
}

function toLatin1(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) bytes.push(code);
    else if (code === 241) bytes.push(0xf1);      // ñ
    else if (code === 209) bytes.push(0xd1);      // Ñ
    else if (code === 225) bytes.push(0xe1);      // á
    else if (code === 233) bytes.push(0xe9);      // é
    else if (code === 237) bytes.push(0xed);      // í
    else if (code === 243) bytes.push(0xf3);      // ó
    else if (code === 250) bytes.push(0xfa);      // ú
    else if (code === 193) bytes.push(0xc1);      // Á
    else if (code === 201) bytes.push(0xc9);      // É
    else if (code === 205) bytes.push(0xcd);      // Í
    else if (code === 211) bytes.push(0xd3);      // Ó
    else if (code === 218) bytes.push(0xda);      // Ú
    else if (code === 161) bytes.push(0xa1);      // ¡
    else if (code === 191) bytes.push(0xbf);      // ¿
    else if (code === 176) bytes.push(0xb0);      // °
    else if (code >= 0x80 && code <= 0xff) bytes.push(code);
    else bytes.push(0x3f); // '?'
  }
  return Buffer.from(bytes);
}

server.listen(BRIDGE_PORT, () => {
  log("========================================");
  log("  TIAMO POS - Puente de Impresion");
  log("========================================");
  log(`Impresora: ${PRINTER_IP}:${PRINTER_PORT}`);
  log(`Puente:    http://localhost:${BRIDGE_PORT}`);
  log("");
  log("Endpoints:");
  log(`  GET  http://localhost:${BRIDGE_PORT}/health`);
  log(`  POST http://localhost:${BRIDGE_PORT}/print`);
  log("");
  log("Para cambiar la IP de la impresora:");
  log(`  set PRINTER_IP=192.168.1.X && node bridge.js`);
  log("");
  log("Listo para recibir tickets del frontend...");
});
