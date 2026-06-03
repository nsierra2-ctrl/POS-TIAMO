/*
  Generador de tickets de texto plano para impresoras térmicas ESC/POS
  - Comanda: para cocina (cuando se crea un pedido)
  - Factura: para cliente (cuando se cobra)
  - Ticket de prueba
*/

export interface TicketItem {
  nombre: string;
  cantidad: number;
  precio: number;
  observaciones?: string;
  emoji?: string;
}

export interface TicketPedido {
  id: number;
  mesa: string;
  items: TicketItem[];
  total: number;
  notas?: string;
  mesero?: string;
  fecha: Date;
  estado?: string;
}

export interface TicketFactura extends TicketPedido {
  pagos: { metodo: string; monto: number }[];
  propina: number;
  totalConPropina: number;
  cambio: number;
  metodoPago: string;
  cobradoPor?: string;
}

const LINE = 30; // 58mm thermal = ~30 chars with safe margin

function padLine(left: string, right: string, width = LINE): string {
  const spaces = width - left.length - right.length;
  return left + " ".repeat(Math.max(1, spaces)) + right;
}

function center(str: string, width = LINE): string {
  const pad = Math.max(0, Math.floor((width - str.length) / 2));
  return " ".repeat(pad) + str;
}

function divider(char = "-", width = LINE): string {
  return char.repeat(width);
}

function fmtPrice(n: number): string {
  return "$" + n.toLocaleString("es-CO");
}

function fmtItemName(i: TicketItem): string {
  const name = `${i.cantidad}x ${i.nombre}`;
  const max = LINE - 8;
  return name.length > max ? name.substring(0, max - 1) + "." : name;
}

export function buildComandaTicket(p: TicketPedido): string {
  const hora = p.fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const fecha = p.fecha.toLocaleDateString("es-CO");

  const itemsTxt = p.items.map((i) => {
    const display = fmtItemName(i);
    const price = fmtPrice(i.precio * i.cantidad);
    return padLine(display, price) + (i.observaciones ? `\n  * ${i.observaciones.substring(0, LINE - 4)}` : "");
  }).join("\n");

  return [
    divider("="),
    center("TIAMO BURGER"),
    center("COMANDA COCINA"),
    divider("="),
    center(`#${String(p.id).padStart(4, "0")}`),
    divider("-"),
    `Mesa:${p.mesa}  ${hora} ${fecha}`,
    divider("-"),
    itemsTxt,
    divider("-"),
    padLine("TOTAL:", fmtPrice(p.total)),
    divider("="),
    p.notas ? `Notas:${p.notas}` : "",
    `Mesero:${p.mesero ?? "-"}`,
    divider("="),
  ].filter(Boolean).join("\n") + "\n";
}

/*  Nota: Para impresoras ESC/POS reales, usamos buildEscPosComanda
    que incluye comandos BOLD, DOUBLE-HEIGHT y DOUBLE-SIZE
    para que el ticket salga con letra oscura y legible. */

export function buildFacturaTicket(p: TicketFactura): string {
  const hora = p.fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const fecha = p.fecha.toLocaleDateString("es-CO");

  const itemsTxt = p.items.map((i) => {
    const display = fmtItemName(i);
    const price = fmtPrice(i.precio * i.cantidad);
    return padLine(display, price) + (i.observaciones ? `\n  * ${i.observaciones.substring(0, LINE - 4)}` : "");
  }).join("\n");

  const pagosTxt = p.pagos.map((pg) =>
    padLine(pg.metodo === "efectivo" ? "Efectivo:" : "Transferencia:", fmtPrice(pg.monto))
  ).join("\n");

  const lines: string[] = [
    divider("="),
    center("TIAMO BURGER"),
    center("Sistema POS v3"),
    center("Tel:3219600269"),
    divider("="),
    center("FACTURA VENTA"),
    center(`#${String(p.id).padStart(4, "0")} Mesa${p.mesa}`),
    divider("="),
    `${fecha} ${hora}`,
    `Mesero:${p.mesero ?? "-"}`,
    `Cajero:${p.cobradoPor ?? "-"}`,
    divider("-"),
    itemsTxt,
    divider("-"),
    padLine("Subtotal:", fmtPrice(p.total)),
  ];

  if (p.propina > 0) lines.push(padLine("Propina:", fmtPrice(p.propina)));
  lines.push(divider("-"));
  lines.push(padLine("TOTAL:", fmtPrice(p.totalConPropina)));
  lines.push(divider("-"));
  lines.push(pagosTxt);
  if (p.cambio > 0) lines.push(padLine("Cambio:", fmtPrice(p.cambio)));
  lines.push(divider("="));
  lines.push(center("Gracias por su visita!"));
  lines.push(divider("="));

  return lines.filter(Boolean).join("\n") + "\n";
}

export function buildTicketPrueba(): string {
  return [
    divider("="),
    center("TIAMO BURGER"),
    center("Sistema POS v3"),
    divider("="),
    center("TICKET PRUEBA"),
    divider("-"),
    new Date().toLocaleString("es-CO"),
    divider("-"),
    padLine("2x Tiamo Classic", "$36.000"),
    padLine("1x Coca-Cola Pet", "$5.000"),
    padLine("1x Papas Locas", "$31.000"),
    divider("-"),
    padLine("TOTAL:", "$72.000"),
    padLine("Efectivo:", "$80.000"),
    padLine("Cambio:", "$8.000"),
    divider("="),
    center("Gracias por su visita!"),
    divider("="),
  ].join("\n") + "\n";
}
