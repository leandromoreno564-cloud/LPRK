// Comprobante de reserva: código, texto para WhatsApp, vista en pantalla e imagen descargable.
import { CFG } from './config.js';
import { esc, money } from './utils.js';

// Código visible del comprobante. Ej: LPRK-000012
export const reservationCode = (id) => `${CFG.nombre.toUpperCase()}-${String(id).padStart(6, '0')}`;

// "2026-10-10 16:30:00" -> "10/10/2026 16:30"
export function formatDate(created) {
  const [date, time] = String(created).split(' ');
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y} ${(time || '').slice(0, 5)}`;
}

// Filas que se muestran en el comprobante (pantalla e imagen)
function receiptRows(order) {
  const rows = [
    ['Fecha', formatDate(order.created)],
    ['Cliente', order.customer],
    ['Teléfono', order.phone],
    ['Producto', order.product_name],
  ];
  if (order.size) rows.push(['Talle', order.size]);
  rows.push(['Cantidad', String(order.qty)]);
  return rows;
}

// Mensaje que el cliente envía por WhatsApp junto con el comprobante
export function receiptWhatsappText(order) {
  return [
    'Hola! Te envío mi comprobante de reserva.',
    `Código: ${reservationCode(order.id)}`,
    `Producto: ${order.product_name}${order.size ? ' (talle ' + order.size + ')' : ''} x${order.qty}`,
    `Total: ${money(order.price * order.qty)}`,
    `A nombre de: ${order.customer}`,
  ].join('\n');
}

// Comprobante en pantalla
export function receiptHtml(order) {
  return `<div class="receipt">
    <div class="receipt-brand">${esc(CFG.nombre)}</div>
    <div class="receipt-title">COMPROBANTE DE RESERVA</div>
    <div class="receipt-code">${esc(reservationCode(order.id))}</div>
    ${receiptRows(order).map(([k, v]) => `<div class="receipt-row"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}
    <div class="receipt-row total"><span>Total</span><b>${money(order.price * order.qty)}</b></div>
    <div class="receipt-note">Reserva pendiente de confirmación</div>
  </div>`;
}

// Dibuja el comprobante en una imagen PNG y la descarga
export function downloadReceiptImage(order) {
  const rows = receiptRows(order);
  const W = 600, pad = 44, rowH = 44;
  const H = 250 + rows.length * rowH + 130;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const font = (size, weight = 400) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;

  // Texto que no entre se acorta con "..."
  const fit = (text, maxWidth) => {
    let t = String(text);
    while (ctx.measureText(t).width > maxWidth && t.length > 1) t = t.slice(0, -2) + '…';
    return t;
  };

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#1d1d1b';
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1d1d1b';
  ctx.font = font(38, 700);
  ctx.fillText(CFG.nombre, W / 2, 84);
  ctx.fillStyle = '#6b6b66';
  ctx.font = font(18, 600);
  ctx.fillText('COMPROBANTE DE RESERVA', W / 2, 118);
  ctx.fillStyle = '#1d1d1b';
  ctx.font = '700 30px ui-monospace, Consolas, monospace';
  ctx.fillText(reservationCode(order.id), W / 2, 176);

  let y = 220;
  ctx.strokeStyle = '#e6e2db';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, y - 20); ctx.lineTo(W - pad, y - 20); ctx.stroke();

  ctx.textAlign = 'left';
  rows.forEach(([label, value]) => {
    y += rowH;
    ctx.fillStyle = '#6b6b66';
    ctx.font = font(18);
    ctx.fillText(label, pad, y);
    ctx.fillStyle = '#1d1d1b';
    ctx.font = font(20, 600);
    ctx.textAlign = 'right';
    ctx.fillText(fit(value, W - pad * 2 - 130), W - pad, y);
    ctx.textAlign = 'left';
  });

  y += rowH + 8;
  ctx.beginPath(); ctx.moveTo(pad, y - 36); ctx.lineTo(W - pad, y - 36); ctx.stroke();
  ctx.fillStyle = '#1d1d1b';
  ctx.font = font(24, 700);
  ctx.fillText('Total', pad, y);
  ctx.textAlign = 'right';
  ctx.fillText(money(order.price * order.qty), W - pad, y);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6b6b66';
  ctx.font = font(16);
  ctx.fillText('Reserva pendiente de confirmación', W / 2, y + 56);
  ctx.fillText('Enviá este comprobante por WhatsApp para confirmarla.', W / 2, y + 82);

  const link = document.createElement('a');
  link.download = `comprobante-${reservationCode(order.id)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
