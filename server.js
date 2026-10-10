// Punto de entrada de LPRK: arma el servidor y conecta las rutas.
const path = require('path');
const express = require('express');
const { port } = require('./src/config');
const { initDb } = require('./src/db');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/stats', require('./src/routes/stats'));

initDb()
  .then(() => app.listen(port, () => console.log(`LPRK en http://localhost:${port}  |  Admin: /admin.html`)))
  .catch((err) => {
    console.error('No se pudo conectar a MySQL. Verificá que Laragon esté iniciado (Start All).');
    console.error(err.message);
    process.exit(1);
  });
