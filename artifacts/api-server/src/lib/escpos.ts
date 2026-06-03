/*
  Generador de comandos ESC/POS binarios para impresoras térmicas
  Compatible con JALTECH JAL-P58, Epson TM-T20, y similares 58mm
  Ancho: 384 puntos = ~32 caracteres (font A 12x24)
*/

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const NUL = 0x00;

// Comandos ESC/POS
const CMD = {
  init: Buffer.from([ESC, 0x40]),
  alignLeft: Buffer.from([ESC, 0x61, 0x00]),
  alignCenter: Buffer.from([ESC, 0x61, 0x01]),
  alignRight: Buffer.from([ESC, 0x61, 0x02]),
  boldOn: Buffer.from([ESC, 0x45, 0x01]),
  boldOff: Buffer.from([ESC, 0x45, 0x00]),
  doubleHeightOn: Buffer.from([ESC, 0x21, 0x10]),
  doubleHeightOff: Buffer.from([ESC, 0x21, 0x00]),
  doubleWidthOn: Buffer.from([ESC, 0x21, 0x20]),
  doubleSizeOn: Buffer.from([ESC, 0x21, 0x30]),
  normalSize: Buffer.from([ESC, 0x21, 0x00]),
  underlineOn: Buffer.from([ESC, 0x2d, 0x01]),
  underlineOff: Buffer.from([ESC, 0x2d, 0x00]),
  cutPartial: Buffer.from([GS, 0x56, 0x01]),
  cutFull: Buffer.from([GS, 0x56, 0x00]),
  feedLines: (n: number) => Buffer.from([ESC, 0x64, n]),
  feedPaper: (n: number) => Buffer.from([ESC, 0x4a, n]),
  codePage: (cp: number) => Buffer.from([ESC, 0x74, cp]), // 16 = CP850 (Latin-1)
};

// Latin-1 fallback map para caracteres comunes en español
function toLatin1(str: string): Buffer {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code === 241) { bytes.push(0xf1); }      // ñ
    else if (code === 209) { bytes.push(0xd1); }        // Ñ
    else if (code === 225) { bytes.push(0xe1); }        // á
    else if (code === 233) { bytes.push(0xe9); }        // é
    else if (code === 237) { bytes.push(0xed); }        // í
    else if (code === 243) { bytes.push(0xf3); }        // ó
    else if (code === 250) { bytes.push(0xfa); }        // ú
    else if (code === 193) { bytes.push(0xc1); }        // Á
    else if (code === 201) { bytes.push(0xc9); }        // É
    else if (code === 205) { bytes.push(0xcd); }        // Í
    else if (code === 211) { bytes.push(0xd3); }        // Ó
    else if (code === 218) { bytes.push(0xda); }        // Ú
    else if (code === 252) { bytes.push(0xfc); }        // ü
    else if (code === 220) { bytes.push(0xdc); }        // Ü
    else if (code === 161) { bytes.push(0xa1); }        // ¡
    else if (code === 191) { bytes.push(0xbf); }        // ¿
    else if (code === 176) { bytes.push(0xb0); }        // °
    else if (code === 8212) { bytes.push(0x2d); }       // — -> -
    else if (code === 8211) { bytes.push(0x2d); }       // – -> -
    else if (code === 8230) { bytes.push(0x2e, 0x2e, 0x2e); } // … -> ...
    else if (code >= 0x80 && code <= 0xff) { bytes.push(code); }
    else { bytes.push(0x3f); } // '?' for unknown chars
  }
  return Buffer.from(bytes);
}

const LINE_CHARS = 30; // 58mm safe margin

function padLine(left: string, right: string, width = LINE_CHARS): string {
  const spaces = width - left.length - right.length;
  return left + " ".repeat(Math.max(1, spaces)) + right;
}

function center(str: string, width = LINE_CHARS): string {
  const pad = Math.max(0, Math.floor((width - str.length) / 2));
  return " ".repeat(pad) + str;
}

function divider(char = "-", width = LINE_CHARS): string {
  return char.repeat(width);
}

function nl() {
  return Buffer.from([LF]);
}

function fmtPrice(n: number): string {
  return "$" + n.toLocaleString("es-CO");
}

function fmtItemName(i: EscPosItem): string {
  const name = `${i.cantidad}x ${i.nombre}`;
  const max = LINE_CHARS - 8;
  return name.length > max ? name.substring(0, max - 1) + "." : name;
}

// Build a single buffer from parts
function concat(...parts: (Buffer | string)[]): Buffer {
  const bufs = parts.map(p => typeof p === "string" ? toLatin1(p) : p);
  return Buffer.concat(bufs);
}

export interface EscPosItem {
  nombre: string;
  cantidad: number;
  precio: number;
  observaciones?: string;
  emoji?: string;
}

export interface EscPosPedido {
  id: number;
  mesa: string;
  items: EscPosItem[];
  total: number;
  notas?: string;
  mesero?: string;
  fecha: Date;
  estado?: string;
}

export interface EscPosFactura extends EscPosPedido {
  pagos: { metodo: string; monto: number }[];
  propina: number;
  totalConPropina: number;
  cambio: number;
  metodoPago: string;
  cobradoPor?: string;
}

export function buildEscPosComanda(p: EscPosPedido): Buffer {
  const hora = p.fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const fecha = p.fecha.toLocaleDateString("es-CO");

  const itemsTxt = p.items.map((i) => {
    const display = fmtItemName(i);
    const price = fmtPrice(i.precio * i.cantidad);
    let line = padLine(display, price);
    if (i.observaciones) {
      line += `\n  * ${i.observaciones.substring(0, LINE_CHARS - 4)}`;
    }
    return line;
  }).join("\n");

  const parts: (Buffer | string)[] = [
    CMD.init,
    CMD.codePage(16),
    CMD.alignCenter,
    CMD.boldOn, CMD.doubleSizeOn,
    "TIAMO BURGER", nl(),
    CMD.normalSize, CMD.boldOff,
    CMD.alignCenter, CMD.boldOn,
    "COMANDA COCINA", nl(),
    CMD.boldOff,
    divider("="), "\n",
    CMD.alignCenter, CMD.boldOn, CMD.doubleHeightOn,
    `#${String(p.id).padStart(4, "0")}`, "\n",
    CMD.normalSize, CMD.boldOff,
    CMD.alignLeft,
    divider("-"), "\n",
    CMD.boldOn,
    `Mesa:${p.mesa}  ${hora} ${fecha}`, "\n",
    CMD.boldOff,
    divider("-"), "\n",
    CMD.boldOn,
    itemsTxt, "\n",
    CMD.boldOff,
    divider("-"), "\n",
    CMD.boldOn, CMD.doubleHeightOn,
    padLine("TOTAL:", fmtPrice(p.total)), "\n",
    CMD.normalSize, CMD.boldOff,
    divider("="), "\n",
  ];

  if (p.notas) {
    parts.push(CMD.boldOn, `Notas:${p.notas}\n`, CMD.boldOff);
  }
  parts.push(CMD.boldOn, `Mesero:${p.mesero ?? "-"}\n`, CMD.boldOff);
  parts.push(divider("="), "\n");
  parts.push(CMD.feedLines(3));
  parts.push(CMD.cutPartial);

  return concat(...parts);
}

export function buildEscPosFactura(p: EscPosFactura): Buffer {
  const hora = p.fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const fecha = p.fecha.toLocaleDateString("es-CO");

  const itemsTxt = p.items.map((i) => {
    const display = fmtItemName(i);
    const price = fmtPrice(i.precio * i.cantidad);
    let line = padLine(display, price);
    if (i.observaciones) {
      line += `\n  * ${i.observaciones.substring(0, LINE_CHARS - 4)}`;
    }
    return line;
  }).join("\n");

  const pagosTxt = p.pagos.map((pg) =>
    padLine(pg.metodo === "efectivo" ? "Efectivo:" : "Transferencia:", fmtPrice(pg.monto)),
  ).join("\n");

  const parts: (Buffer | string)[] = [
    CMD.init,
    CMD.codePage(16),
    CMD.alignCenter,
    CMD.boldOn, CMD.doubleSizeOn,
    "TIAMO BURGER", nl(),
    CMD.normalSize, CMD.boldOff,
    CMD.alignCenter, CMD.boldOn,
    "Sistema POS v3", "\n",
    CMD.boldOff,
    CMD.alignCenter,
    "Tel:3219600269", "\n",
    divider("="), "\n",
    CMD.alignCenter, CMD.boldOn, CMD.doubleHeightOn,
    "FACTURA VENTA", "\n",
    CMD.normalSize, CMD.boldOff,
    CMD.alignCenter, CMD.boldOn,
    `#${String(p.id).padStart(4, "0")} Mesa${p.mesa}`, "\n",
    CMD.boldOff,
    divider("="), "\n",
    CMD.alignLeft,
    `${fecha} ${hora}`, "\n",
    CMD.boldOn,
    `Mesero:${p.mesero ?? "-"}`, "\n",
    `Cajero:${p.cobradoPor ?? "-"}`, "\n",
    CMD.boldOff,
    divider("-"), "\n",
    CMD.boldOn,
    itemsTxt, "\n",
    CMD.boldOff,
    divider("-"), "\n",
    CMD.boldOn,
    padLine("Subtotal:", fmtPrice(p.total)), "\n",
    CMD.boldOff,
  ];

  if (p.propina > 0) {
    parts.push(CMD.boldOn, padLine("Propina:", fmtPrice(p.propina)), "\n", CMD.boldOff);
  }

  parts.push(
    divider("-"), "\n",
    CMD.boldOn, CMD.doubleSizeOn,
    padLine("TOTAL:", fmtPrice(p.totalConPropina)), "\n",
    CMD.normalSize, CMD.boldOff,
    divider("-"), "\n",
    CMD.boldOn,
    pagosTxt, "\n",
    CMD.boldOff,
  );

  if (p.cambio > 0) {
    parts.push(CMD.boldOn, padLine("Cambio:", fmtPrice(p.cambio)), "\n", CMD.boldOff);
  }

  parts.push(
    divider("="), "\n",
    CMD.alignCenter, CMD.boldOn,
    "Gracias por su visita!", "\n",
    CMD.boldOff,
    divider("="), "\n",
    CMD.feedLines(4),
    CMD.cutPartial,
  );

  return concat(...parts);
}

export function buildEscPosPrueba(): Buffer {
  const now = new Date().toLocaleString("es-CO");
  const parts: (Buffer | string)[] = [
    CMD.init,
    CMD.codePage(16),
    CMD.alignCenter, CMD.doubleSizeOn,
    "TIAMO BURGER", nl(),
    CMD.normalSize,
    "TICKET PRUEBA", "\n",
    divider("="), "\n",
    CMD.alignLeft,
    now, "\n",
    divider("-"), "\n",
    padLine("2x Tiamo Classic", "$36.000"), "\n",
    padLine("1x Coca-Cola Pet", "$5.000"), "\n",
    padLine("1x Papas Locas", "$31.000"), "\n",
    divider("-"), "\n",
    padLine("TOTAL:", "$72.000"), "\n",
    padLine("Efectivo:", "$80.000"), "\n",
    padLine("Cambio:", "$8.000"), "\n",
    divider("="), "\n",
    CMD.alignCenter,
    "Gracias por su visita!", "\n",
    divider("="), "\n",
    CMD.feedLines(3),
    CMD.cutPartial,
  ];
  return concat(...parts);
}

// Convert text ticket to ESC/POS binary for network printing
export function textToEscPos(text: string): Buffer {
  const parts: (Buffer | string)[] = [
    CMD.init,
    CMD.codePage(16),
    CMD.alignLeft,
  ];

  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      parts.push("\n");
      continue;
    }
    // Detect centered lines
    if (trimmed.startsWith("TIAMO") || trimmed.startsWith("COMANDA") || trimmed.startsWith("FACTURA") || trimmed.startsWith("TICKET") || trimmed.startsWith("Gracias") || trimmed.startsWith("www.")) {
      parts.push(CMD.alignCenter, trimmed, "\n", CMD.alignLeft);
    } else if (trimmed.startsWith("===") || trimmed.startsWith("---")) {
      parts.push(CMD.alignCenter, trimmed, "\n", CMD.alignLeft);
    } else {
      parts.push(trimmed, "\n");
    }
  }

  parts.push(CMD.feedLines(3), CMD.cutPartial);
  return concat(...parts);
}
