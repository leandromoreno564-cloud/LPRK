// Panel de administración: ingreso, resumen, productos y pedidos.
import { $, esc, money, resizeImage } from './utils.js';
import { reservationCode } from './receipt.js';

const STATUSES = ['reservado', 'pendiente', 'vendido', 'cancelado'];
let token = sessionStorage.getItem('token') || '';

// ---------- API ----------
async function api(path, method = 'GET', body) {
  const res = await fetch('/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-token': token },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    logout();
    throw new Error('No autorizado');
  }
  return res.json();
}

// ---------- Sesión ----------
function showApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;
  loadSummary();
  loadProducts();
  loadOrders();
}

function logout() {
  sessionStorage.removeItem('token');
  token = '';
  $('#app').hidden = true;
  $('#login').hidden = false;
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pass: $('#password').value }),
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    sessionStorage.setItem('token', token);
    showApp();
  } else {
    $('#loginError').textContent = data.error;
  }
});
$('#logout').addEventListener('click', logout);

// ---------- Pestañas ----------
document.querySelectorAll('[data-tab]').forEach((button) =>
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((s) => (s.hidden = s.id !== button.dataset.tab));
    document.querySelectorAll('[data-tab]').forEach((b) => (b.className = 'btn' + (b === button ? '' : ' outline')));
  })
);

// ---------- Resumen ----------
async function loadSummary() {
  const s = await api('stats');
  const rows = (list, row, empty) => list.map(row).join('') || `<tr><td>${empty}</td></tr>`;

  $('#summary').innerHTML = `
    <div class="stats">
      <div class="box stat"><b>${money(s.total)}</b><span>Total vendido</span></div>
      <div class="box stat"><b>${s.vendidos}</b><span>Ventas</span></div>
      <div class="box stat"><b>${s.pendientes}</b><span>Reservas pendientes</span></div>
    </div>
    <div class="box table-wrap"><h3>Más vendidos</h3><table>
      ${rows(s.top, (t) => `<tr><td>${esc(t.name)}</td><td>${t.units} u.</td><td>${money(t.total)}</td></tr>`, 'Sin ventas todavía')}
    </table></div>
    <div class="box table-wrap"><h3>Ventas por mes</h3><table>
      ${rows(s.month, (m) => `<tr><td>${m.m}</td><td>${money(m.total)}</td></tr>`, 'Sin datos')}
    </table></div>`;
}

// ---------- Productos ----------
async function loadProducts() {
  const list = await api('products');
  $('#productList').innerHTML = list
    .map(
      (p) => `<tr>
        <td>${p.image ? `<img src="${p.image}" alt="">` : ''}</td>
        <td data-label="Producto">${esc(p.name)}</td>
        <td data-label="Precio"><input type="number" value="${p.price}" data-id="${p.id}" data-field="price"></td>
        <td data-label="Stock"><input type="number" value="${p.stock}" data-id="${p.id}" data-field="stock"></td>
        <td data-label="Categoría">${esc(p.category)}</td>
        <td><button class="btn outline" type="button" data-delete="${p.id}">Borrar</button></td>
      </tr>`
    )
    .join('');
}

// Editar precio o stock directamente en la tabla
$('#productList').addEventListener('change', (e) => {
  const { id, field } = e.target.dataset;
  if (id) api('products/' + id, 'PUT', { [field]: Number(e.target.value) });
});

// Borrar producto
$('#productList').addEventListener('click', async (e) => {
  const id = e.target.dataset.delete;
  if (id && confirm('¿Borrar producto?')) {
    await api('products/' + id, 'DELETE');
    loadProducts();
  }
});

// Publicar producto nuevo
$('#productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  await api('products', 'POST', {
    name: data.get('name'),
    price: Number(data.get('price')),
    sizes: data.get('sizes'),
    category: data.get('category'),
    stock: Number(data.get('stock')),
    image: await resizeImage(data.get('img'), 700, 0.75),
  });
  e.target.reset();
  loadProducts();
});

// ---------- Pedidos ----------
async function loadOrders() {
  const list = await api('orders');
  $('#orderList').innerHTML =
    list
      .map((o) => {
        const phone = o.phone
          ? `<a href="https://wa.me/${esc(o.phone.replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(o.phone)}</a>`
          : '';
        const options = STATUSES.map((s) => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('');
        return `<tr>
          <td data-label="Código">${esc(reservationCode(o.id))}</td>
          <td data-label="Fecha">${o.created.slice(0, 16)}</td>
          <td data-label="Cliente">${esc(o.customer)}</td>
          <td data-label="Teléfono">${phone}</td>
          <td data-label="Producto">${esc(o.product_name)} ${esc(o.size)} x${o.qty}</td>
          <td data-label="Total">${money(o.price * o.qty)}</td>
          <td data-label="Estado"><select data-order="${o.id}">${options}</select></td>
        </tr>`;
      })
      .join('') || '<tr><td>Sin pedidos</td></tr>';
}

// Cambiar estado de un pedido (puede mover el stock)
$('#orderList').addEventListener('change', async (e) => {
  const id = e.target.dataset.order;
  if (!id) return;
  await api('orders/' + id, 'PUT', { status: e.target.value });
  loadSummary();
  loadProducts();
});

// ---------- Inicio ----------
if (token) showApp();
