const router = require('express').Router();
const { db } = require('../db');
const { requireAuth, asyncHandler } = require('../middleware');

// GET /api/stats - resumen para el panel admin
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const [[sold]] = await db.query(
    "SELECT COUNT(*) n, COALESCE(SUM(price * qty), 0) total FROM orders WHERE status = 'vendido'"
  );
  const [[pending]] = await db.query("SELECT COUNT(*) n FROM orders WHERE status IN ('reservado', 'pendiente')");
  const [top] = await db.query(
    `SELECT MAX(product_name) name, SUM(qty) units, SUM(price * qty) total
       FROM orders WHERE status = 'vendido'
      GROUP BY product_id ORDER BY units DESC LIMIT 5`
  );
  const [month] = await db.query(
    `SELECT DATE_FORMAT(created, '%Y-%m') m, SUM(price * qty) total
       FROM orders WHERE status = 'vendido'
      GROUP BY m ORDER BY m DESC LIMIT 6`
  );

  res.json({
    vendidos: sold.n,
    total: sold.total,
    pendientes: pending.n,
    top: top.map((t) => ({ ...t, units: Number(t.units) })),
    month,
  });
}));

module.exports = router;
