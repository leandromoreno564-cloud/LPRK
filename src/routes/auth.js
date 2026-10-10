const router = require('express').Router();
const { adminPass } = require('../config');
const { createToken } = require('../middleware');

// POST /api/login
router.post('/login', (req, res) => {
  if (req.body.pass !== adminPass) return res.status(401).json({ error: 'Contraseña incorrecta' });
  res.json({ token: createToken() });
});

module.exports = router;
