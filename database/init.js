// Crea la base de datos y las tablas: npm run init-db
const { initDb } = require('../src/db');

initDb()
  .then(() => { console.log('Base de datos lista.'); process.exit(0); })
  .catch((err) => { console.error('Error:', err.message); process.exit(1); });
