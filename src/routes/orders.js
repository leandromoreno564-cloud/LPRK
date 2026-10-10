const router = require('express').Router();
const { db } = require('../db');
const { requireAuth, asyncHandler } = require('../middleware');

const STATUSES = ['reservado', 'pendiente', 'vendido', 'cancelado'];

// POST /api/orders - crear una reserva (público). Devuelve la reserva completa para armar el comprobante.
// El precio sale siempre de la base de datos, nunca del cliente.
router.post('/', asyncHandler(async (req, res) => {
  const { product_id, size = '', qty = 1, customer = '', phone = '' } = req.body;
  const quantity = Math.max(1, parseInt(qty) || 1);

  if (!String(customer).trim() || !String(phone).trim()) {
    return res.status(400).json({ error: 'Completá tu nombre y teléfono' });
  }
  const [[product]] = await db.query('SELECT * FROM products WHERE id = ?', [product_id]);
  if (!product) return res.status(404).json({ error: 'Producto inexistente' });
  if (product.stock < quantity) return res.status(400).json({ error: 'No hay stock suficiente' });

  const [result] = await db.query(
    'INSERT INTO orders (product_id, product_name, price, size, qty, customer, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      product.id,
      product.name,
      product.price,
      String(size).slice(0, 20),
      quantity,
      String(customer).trim().slice(0, 80),
      String(phone).trim().slice(0, 30),
    ]
  );
  const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
  res.json(order);
}));

// GET /api/orders - últimos 300 pedidos (admin)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT 300');
  res.json(rows);
}));

// PUT /api/orders/:id - cambiar estado (admin).
// Al pasar a "vendido" descuenta stock; al salir de "vendido" lo devuelve.
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Estado inválido' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);

    if (order && order.status !== status) {
      if (status === 'vendido') {
        await conn.query('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [order.qty, order.product_id]);
      }
      if (order.status === 'vendido') {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [order.qty, order.product_id]);
      }
      await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, order.id]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  res.json({ ok: 1 });
}));

module.exports = router;
