// Configuración general. Los valores salen del archivo .env
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  adminPass: process.env.ADMIN_PASS || 'admin123',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'lprk',
  },
};
