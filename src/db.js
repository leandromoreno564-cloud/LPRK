// Conexión a MySQL y creación de la base de datos.
// La estructura de las tablas vive en database/schema.sql (única fuente).
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { db: cfg } = require('./config');

const connection = { host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password };

// Pool de conexiones que usan todas las rutas.
// dateStrings: fechas como texto. decimalNumbers: DECIMAL como número (no string).
const db = mysql.createPool({
  ...connection,
  database: cfg.name,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  decimalNumbers: true,
});

// Crea la base y las tablas si todavía no existen.
async function initDb() {
  const schema = fs
    .readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8')
    .replace(/lprk/g, cfg.name);
  const conn = await mysql.createConnection({ ...connection, multipleStatements: true });
  try {
    await conn.query(schema);
    // Bases creadas con una versión anterior: agrega el estado "reservado" si falta (no borra datos).
    await conn.query(
      "ALTER TABLE orders MODIFY status ENUM('reservado','pendiente','vendido','cancelado') NOT NULL DEFAULT 'reservado'"
    );
  } finally {
    await conn.end();
  }
}

module.exports = { db, initDb };
