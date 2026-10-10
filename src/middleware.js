// Utilidades compartidas por las rutas.
const crypto = require('crypto');

// Tokens de sesión del panel admin (en memoria: se pierden al reiniciar el servidor).
const tokens = new Set();

const createToken = () => {
  const token = crypto.randomBytes(24).toString('hex');
  tokens.add(token);
  return token;
};

// Exige el header x-token en las rutas del admin.
const requireAuth = (req, res, next) =>
  tokens.has(req.get('x-token')) ? next() : res.status(401).json({ error: 'No autorizado' });

// Envuelve rutas async para que los errores no tumben el servidor.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  });

module.exports = { createToken, requireAuth, asyncHandler };
