// Ventana de reserva: producto + formulario, y después el comprobante.
import { CFG } from './config.js';
import { $, esc, money, whatsappLink } from './utils.js';
import { receiptHtml, receiptWhatsappText, downloadReceiptImage } from './receipt.js';

const dialog = $('#reserveDialog');
let current = null; // { product, order, onReserved }

// Abre la ventana. onReserved(order) se llama al cerrarla si el cliente llegó a reservar.
export function openReserve(product, { onReserved } = {}) {
  current = { product, order: null, onReserved };
  renderForm();
  dialog.showModal();
}

// ---------- Paso 1: producto y formulario ----------
function renderForm() {
  const p = current.product;
  const sizes = String(p.sizes || '').split(',').map((s) => s.trim()).filter(Boolean);
  const consult = whatsappLink(CFG.whatsapp, `Hola! Quiero consultar por: ${p.name} (${money(p.price)})`);

  const summary = `<div class="rsv-product">
    ${p.image ? `<img src="${p.image}" alt="">` : '<div class="rsv-ph">LPRK</div>'}
    <div>
      <small>${esc(p.category)}</small>
      <b>${esc(p.name)}</b>
      <span class="price">${money(p.price)}</span>
      ${sizes.length ? `<small>Talles: ${esc(sizes.join(', '))}</small>` : ''}
    </div>
  </div>`;

  const form =
    p.stock > 0
      ? `<form id="reserveForm" class="rsv-form">
          <input name="customer" placeholder="Tu nombre" maxlength="80" required>
          <input name="phone" type="tel" placeholder="Tu teléfono" maxlength="30" required>
          ${sizes.length ? `<select name="size" required><option value="">Elegí un talle</option>${sizes.map((s) => `<option>${esc(s)}</option>`).join('')}</select>` : ''}
          <input name="qty" type="number" min="1" max="${p.stock}" value="1" required>
          <div class="rsv-total">Total: <b id="reserveTotal">${money(p.price)}</b></div>
          <p class="error" id="reserveError"></p>
          <button class="btn" type="submit">Reservar</button>
        </form>`
      : '<p class="empty">Sin stock por el momento.</p>';

  dialog.innerHTML = `${summary}${form}
    <div class="rsv-actions">
      <a class="btn outline" target="_blank" rel="noopener" href="${consult}">Consultar por WhatsApp</a>
      <button class="btn outline" type="button" data-close>Cerrar</button>
    </div>`;
}

// ---------- Paso 2: comprobante ----------
function renderReceipt() {
  const order = current.order;
  const waUrl = whatsappLink(CFG.whatsapp, receiptWhatsappText(order));
  dialog.innerHTML = `${receiptHtml(order)}
    <p class="rsv-hint">Descargá el comprobante y envialo por WhatsApp para confirmar tu reserva.</p>
    <div class="rsv-actions col">
      <a class="btn wa" target="_blank" rel="noopener" href="${waUrl}">Enviar comprobante por WhatsApp</a>
      <button class="btn outline" type="button" data-download>Descargar comprobante</button>
      <button class="btn outline" type="button" data-close>Cerrar</button>
    </div>`;
}

// ---------- Eventos ----------
dialog.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) dialog.close();
  if (e.target.closest('[data-download]')) downloadReceiptImage(current.order);
  if (e.target === dialog) dialog.close(); // clic en el fondo
});

// El total se actualiza al cambiar la cantidad
dialog.addEventListener('input', (e) => {
  if (e.target.name !== 'qty') return;
  const qty = Math.max(1, Number(e.target.value) || 1);
  $('#reserveTotal').textContent = money(current.product.price * qty);
});

dialog.addEventListener('submit', async (e) => {
  if (e.target.id !== 'reserveForm') return;
  e.preventDefault();
  const data = new FormData(e.target);
  const button = e.target.querySelector('button[type=submit]');
  button.disabled = true;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: current.product.id,
        customer: data.get('customer'),
        phone: data.get('phone'),
        size: data.get('size') || '',
        qty: Number(data.get('qty')),
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'No se pudo registrar la reserva.');
    current.order = body;
    renderReceipt();
  } catch (err) {
    $('#reserveError').textContent = err.message;
    button.disabled = false;
  }
});

dialog.addEventListener('close', () => {
  if (current && current.order && current.onReserved) current.onReserved(current.order);
  current = null;
});
