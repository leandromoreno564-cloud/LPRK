const router = require('express').Router();
const { db } = require('../db');
const { requireAuth, asyncHandler } = require('../middleware');

// GET /api/products - público
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
  res.json(rows);
}));

// POST /api/products - crear (admin)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { name, price, sizes = '', category = 'Otros', stock = 0, image = '' } = req.body;
  if (!name || !(price >= 0)) return res.status(400).json({ error: 'Datos inválidos' });

  const [result] = await db.query(
    'INSERT INTO products (name, price, sizes, category, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
    [name, price, sizes, category, stock, image]
  );
  res.json({ id: result.insertId });
}));

// PUT /api/products/:id - editar solo los campos enviados (admin)
router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const b = req.body;
  await db.query(
    `UPDATE products SET
       name     = COALESCE(?, name),
       price    = COALESCE(?, price),
       sizes    = COALESCE(?, sizes),
       category = COALESCE(?, category),
       stock    = COALESCE(?, stock),
       image    = COALESCE(?, image)
     WHERE id = ?`,
    [b.name ?? null, b.price ?? null, b.sizes ?? null, b.category ?? null, b.stock ?? null, b.image ?? null, req.params.id]
  );
  res.json({ ok: 1 });
}));

// DELETE /api/products/:id (admin)
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ ok: 1 });
}));

module.exports = router;
