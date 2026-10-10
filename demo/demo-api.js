/*
 * VERSIÓN DEMO (GitHub Pages)
 * Reemplaza el servidor: intercepta las llamadas a /api/* y guarda todo en el navegador (localStorage).
 * No se usa en la versión real con Node + MySQL.
 */
(function () {
  var KEY = 'lprk-demo-v1';
  var DEMO_PASS = 'admin123';
  var DEMO_TOKEN = 'demo-token';
  var memory = null;

  // ---------- Datos de ejemplo ----------
  function placeholder(label, bg) {
    var r = parseInt(bg.slice(1, 3), 16), g = parseInt(bg.slice(3, 5), 16), b = parseInt(bg.slice(5, 7), 16);
    var text = (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#1d1d1b' : '#ffffff';
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'><rect width='300' height='300' fill='" + bg +
      "'/><text x='150' y='158' font-family='sans-serif' font-size='24' font-weight='700' letter-spacing='3' text-anchor='middle' fill='" +
      text + "'>" + label.toUpperCase() + '</text></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function stamp(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  function seed() {
    var items = [
      ['Remera Básica Blanca', 9000, 'S, M, L', 'Remeras', 12, '#e8e4dc'],
      ['Remera Oversize Negra', 12500, 'M, L, XL', 'Remeras', 8, '#2b2b2b'],
      ['Jean Recto Azul', 25000, '38, 40, 42, 44', 'Pantalones', 6, '#3d5a80'],
      ['Pantalón Cargo Verde', 27500, '38, 40, 42', 'Pantalones', 4, '#6b705c'],
      ['Campera Rompeviento', 48000, 'M, L, XL', 'Camperas', 3, '#bc6c25'],
      ['Campera de Jean', 42000, 'S, M, L', 'Camperas', 0, '#577590'],
      ['Vestido Largo Floral', 32000, 'S, M', 'Vestidos', 5, '#e5989b'],
      ['Zapatillas Urbanas', 55000, '38, 39, 40, 41, 42', 'Calzado', 7, '#f2efe9'],
      ['Gorra Clásica', 8000, '', 'Accesorios', 15, '#8d99ae'],
    ];
    var now = new Date();
    var products = items.map(function (it, i) {
      return { id: i + 1, name: it[0], price: it[1], sizes: it[2], category: it[3], stock: it[4],
        image: placeholder(it[3], it[5]), created: stamp(now) };
    });
    var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 12, 15, 30, 0);
    var orders = [
      { id: 1, product_id: 3, product_name: 'Jean Recto Azul', price: 25000, size: '40', qty: 1, customer: 'Lucía Fernández', phone: '5491155550001', status: 'vendido', created: stamp(lastMonth) },
      { id: 2, product_id: 1, product_name: 'Remera Básica Blanca', price: 9000, size: 'M', qty: 2, customer: 'Martín Gómez', phone: '5491155550002', status: 'vendido', created: stamp(new Date(now.getFullYear(), now.getMonth(), 2, 11, 0, 0)) },
      { id: 3, product_id: 7, product_name: 'Vestido Largo Floral', price: 32000, size: 'S', qty: 1, customer: 'Camila Rojas', phone: '5491155550003', status: 'reservado', created: stamp(now) },
    ];
    return { products: products, orders: orders, nextProduct: products.length + 1, nextOrder: orders.length + 1 };
  }

  // ---------- Almacenamiento (si localStorage falla, usa memoria) ----------
  function load() {
    if (memory) return memory;
    try {
      var saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.products) { memory = saved; return memory; }
    } catch (e) {}
    memory = seed();
    save();
    return memory;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch (e) {} }

  // ---------- API simulada (misma forma que el servidor real) ----------
  var STATUSES = ['reservado', 'pendiente', 'vendido', 'cancelado'];
  function find(list, id) { return list.filter(function (x) { return x.id === Number(id); })[0]; }

  function handle(path, method, body, token) {
    var db = load();
    var parts = path.split('/');
    var admin = token === DEMO_TOKEN;
    var denied = [401, { error: 'No autorizado' }];

    if (path === 'login' && method === 'POST') {
      return body.pass === DEMO_PASS ? [200, { token: DEMO_TOKEN }] : [401, { error: 'Contraseña incorrecta' }];
    }

    if (parts[0] === 'products') {
      if (method === 'GET') return [200, db.products.slice().sort(function (a, b) { return b.id - a.id; })];
      if (!admin) return denied;
      if (method === 'POST') {
        if (!body.name || !(body.price >= 0)) return [400, { error: 'Datos inválidos' }];
        var p = { id: db.nextProduct++, name: body.name, price: body.price, sizes: body.sizes || '',
          category: body.category || 'Otros', stock: body.stock || 0, image: body.image || '', created: stamp(new Date()) };
        db.products.push(p); save();
        return [200, { id: p.id }];
      }
      var prod = find(db.products, parts[1]);
      if (method === 'PUT' && prod) {
        ['name', 'price', 'sizes', 'category', 'stock', 'image'].forEach(function (k) { if (body[k] != null) prod[k] = body[k]; });
        save();
        return [200, { ok: 1 }];
      }
      if (method === 'DELETE') {
        db.products = db.products.filter(function (x) { return x.id !== Number(parts[1]); });
        save();
        return [200, { ok: 1 }];
      }
    }

    if (parts[0] === 'orders') {
      if (method === 'POST') {
        var qty = Math.max(1, parseInt(body.qty) || 1);
        if (!String(body.customer || '').trim() || !String(body.phone || '').trim()) return [400, { error: 'Completá tu nombre y teléfono' }];
        var product = find(db.products, body.product_id);
        if (!product) return [404, { error: 'Producto inexistente' }];
        if (product.stock < qty) return [400, { error: 'No hay stock suficiente' }];
        var order = { id: db.nextOrder++, product_id: product.id, product_name: product.name, price: product.price,
          size: String(body.size || '').slice(0, 20), qty: qty, customer: String(body.customer).trim().slice(0, 80),
          phone: String(body.phone).trim().slice(0, 30), status: 'reservado', created: stamp(new Date()) };
        db.orders.push(order); save();
        return [200, order];
      }
      if (!admin) return denied;
      if (method === 'GET') return [200, db.orders.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 300)];
      if (method === 'PUT') {
        if (STATUSES.indexOf(body.status) < 0) return [400, { error: 'Estado inválido' }];
        var o = find(db.orders, parts[1]);
        if (o && o.status !== body.status) {
          var target = find(db.products, o.product_id);
          if (target) {
            if (body.status === 'vendido') target.stock = Math.max(target.stock - o.qty, 0);
            if (o.status === 'vendido') target.stock += o.qty;
          }
          o.status = body.status; save();
        }
        return [200, { ok: 1 }];
      }
    }

    if (path === 'stats' && method === 'GET') {
      if (!admin) return denied;
      var sold = db.orders.filter(function (x) { return x.status === 'vendido'; });
      var total = 0, byProduct = {}, byMonth = {};
      sold.forEach(function (x) {
        var amount = x.price * x.qty; total += amount;
        var t = byProduct[x.product_id] = byProduct[x.product_id] || { name: x.product_name, units: 0, total: 0 };
        t.units += x.qty; t.total += amount;
        var m = x.created.slice(0, 7); byMonth[m] = (byMonth[m] || 0) + amount;
      });
      return [200, {
        vendidos: sold.length, total: total,
        pendientes: db.orders.filter(function (x) { return x.status === 'reservado' || x.status === 'pendiente'; }).length,
        top: Object.keys(byProduct).map(function (k) { return byProduct[k]; }).sort(function (a, b) { return b.units - a.units; }).slice(0, 5),
        month: Object.keys(byMonth).sort().reverse().slice(0, 6).map(function (m) { return { m: m, total: byMonth[m] }; }),
      }];
    }

    return [404, { error: 'No encontrado' }];
  }

  // ---------- Intercepta fetch('/api/...') ----------
  var realFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    var u = String(url);
    if (u.indexOf('/api/') !== 0) return realFetch(url, opts);
    opts = opts || {};
    var headers = opts.headers || {};
    var result = handle(u.slice(5), (opts.method || 'GET').toUpperCase(), opts.body ? JSON.parse(opts.body) : {}, headers['x-token']);
    return Promise.resolve(new Response(JSON.stringify(result[1]), { status: result[0], headers: { 'Content-Type': 'application/json' } }));
  };

  // ---------- Aviso de demostración ----------
  document.addEventListener('DOMContentLoaded', function () {
    var isAdmin = /admin/.test(location.pathname);
    var bar = document.createElement('div');
    bar.style.cssText = 'background:#1d1d1b;color:#f2efe9;font:13px/1.4 system-ui,sans-serif;text-align:center;padding:8px 12px';
    bar.textContent = 'Versión de demostración: los datos se guardan solo en este navegador.' +
      (isAdmin ? ' Clave del panel: ' + DEMO_PASS : '');
    document.body.insertBefore(bar, document.body.firstChild);
  });
})();
