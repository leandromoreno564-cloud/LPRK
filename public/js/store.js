// Tienda: catálogo, filtro por categoría, reservas y arranque del chat.
import { CFG } from './config.js';
import { $, esc, money, whatsappLink } from './utils.js';
import { initChat } from './chat/chat.js';
import { openReserve } from './reserve.js';

const state = { products: [], category: 'Todas' };

// ---------- Catálogo ----------
function renderCategories() {
  const categories = ['Todas', ...new Set(state.products.map((p) => p.category))];
  $('#cats').innerHTML = categories
    .map((c) => `<button type="button" class="${c === state.category ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`)
    .join('');
}

function productCard(p) {
  return `<article class="card">
    ${p.image ? `<img src="${p.image}" alt="${esc(p.name)}">` : '<img alt="" style="visibility:hidden">'}
    <div class="card-body">
      <small>${esc(p.category)}</small>
      <b>${esc(p.name)}</b>
      <span class="price">${money(p.price)}</span>
      <small>${p.sizes ? 'Talles: ' + esc(p.sizes) : ''}</small>
      ${p.stock > 0 ? '' : '<small>Sin stock</small>'}
      <button type="button" class="btn" data-reserve="${p.id}">Consultar</button>
    </div>
  </article>`;
}

function render() {
  document.title = CFG.nombre;
  $('#shopName').textContent = CFG.nombre;
  $('#waTop').href = whatsappLink(CFG.whatsapp, 'Hola! Quiero hacer una consulta.');

  const visible = state.category === 'Todas' ? state.products : state.products.filter((p) => p.category === state.category);
  renderCategories();
  $('#grid').innerHTML = visible.length ? visible.map(productCard).join('') : '<p class="empty">Todavía no hay productos.</p>';
}

// ---------- Reserva ----------
// Abre la ventana de reserva. Al cerrarla con una reserva hecha, el bot pide enviar el comprobante.
function reserve(id) {
  const product = state.products.find((p) => p.id === id);
  if (product) openReserve(product, { onReserved: (order) => chat.announceReservation(order) });
}

// ---------- Eventos ----------
$('#cats').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cat]');
  if (!btn) return;
  state.category = btn.dataset.cat;
  render();
});
$('#grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-reserve]');
  if (btn) reserve(Number(btn.dataset.reserve));
});

// ---------- Inicio ----------
const chat = initChat(state, { reserve });
fetch('/api/products')
  .then((r) => r.json())
  .then((products) => { state.products = products; })
  .catch(() => {})
  .finally(render);
