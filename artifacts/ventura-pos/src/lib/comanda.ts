import { formatPrice } from "./constants";

export interface ComandaData {
  id: number;
  mesa: string;
  items: Array<{ nombre: string; emoji: string; precio: number; cantidad: number }>;
  notas?: string;
  total: number;
}

export function imprimirComanda(pedido: ComandaData) {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const fecha = ahora.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const turno = pedido.id.toString().padStart(4, "0");

  const itemsHtml = pedido.items
    .map(
      (item) => `
    <div class="row">
      <span class="qty">${item.cantidad}x</span>
      <span class="name">${item.nombre}</span>
      <span class="price">${formatPrice(item.precio * item.cantidad)}</span>
    </div>`,
    )
    .join("");

  const notasHtml = pedido.notas
    ? `<div class="divider dashed"></div>
    <div class="nota-box">
      <div class="nota-title">*** NOTAS ESPECIALES ***</div>
      <div class="nota-text">${pedido.notas}</div>
    </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comanda #${turno}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      width: 80mm;
      padding: 5mm 4mm;
      color: #000;
      background: #fff;
    }
    .header { text-align: center; margin-bottom: 6px; }
    .restaurant { font-size: 17px; font-weight: bold; letter-spacing: 1px; }
    .subtitle { font-size: 10px; margin-top: 2px; color: #333; }
    .divider { margin: 5px 0; }
    .divider.solid { border-top: 2px solid #000; }
    .divider.dashed { border-top: 2px dashed #000; }
    .turno-box { text-align: center; margin: 4px 0; }
    .turno-label { font-size: 11px; font-weight: bold; letter-spacing: 3px; }
    .turno-num { font-size: 38px; font-weight: bold; line-height: 1; letter-spacing: 2px; }
    .info-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 12px; }
    .section-title { font-weight: bold; font-size: 11px; letter-spacing: 1px; margin-bottom: 3px; }
    .row { display: flex; align-items: baseline; padding: 3px 0; font-size: 13px; }
    .qty { font-weight: bold; min-width: 22px; }
    .name { flex: 1; padding: 0 4px; }
    .price { font-weight: bold; white-space: nowrap; }
    .total-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 2px; }
    .total-label { font-size: 14px; font-weight: bold; }
    .total-price { font-size: 18px; font-weight: bold; }
    .nota-box { background: #f0f0f0; border: 1px solid #000; padding: 4px; margin: 3px 0; }
    .nota-title { font-weight: bold; font-size: 10px; letter-spacing: 1px; }
    .nota-text { margin-top: 2px; font-size: 12px; }
    .footer { text-align: center; font-size: 10px; color: #222; margin-top: 6px; }
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { padding: 3mm 2mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="restaurant">TIAMO BURGER</div>
    <div class="subtitle">Sistema POS</div>
  </div>

  <div class="divider solid"></div>

  <div class="turno-box">
    <div class="turno-label">COMANDA</div>
    <div class="turno-num">#${turno}</div>
  </div>

  <div class="divider solid"></div>

  <div class="info-row"><span>MESA:</span><span><strong>${pedido.mesa}</strong></span></div>
  <div class="info-row"><span>HORA:</span><span>${hora}</span></div>
  <div class="info-row"><span>FECHA:</span><span>${fecha}</span></div>

  <div class="divider dashed"></div>
  <div class="section-title">ITEMS PEDIDOS:</div>
  ${itemsHtml}

  ${notasHtml}

  <div class="divider solid"></div>
  <div class="total-row">
    <span class="total-label">TOTAL:</span>
    <span class="total-price">${formatPrice(pedido.total)}</span>
  </div>
  <div class="divider dashed"></div>

  <div class="footer">
    Ticket generado automaticamente<br>
    Gracias por su pedido
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=420,height=700,toolbar=0,menubar=0,scrollbars=1");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  }
}
