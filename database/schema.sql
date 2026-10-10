-- Base de datos de LPRK (MySQL / Laragon)
-- Importar desde HeidiSQL, phpMyAdmin o con: mysql -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS lprk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lprk;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  sizes VARCHAR(100) NOT NULL DEFAULT '',
  category VARCHAR(60) NOT NULL DEFAULT 'Otros',
  stock INT NOT NULL DEFAULT 0,
  image MEDIUMTEXT,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NULL,
  product_name VARCHAR(150),
  price DECIMAL(12,2),
  size VARCHAR(20) NOT NULL DEFAULT '',
  qty INT NOT NULL DEFAULT 1,
  customer VARCHAR(80) NOT NULL DEFAULT '',
  phone VARCHAR(30) NOT NULL DEFAULT '',
  status ENUM('reservado','pendiente','vendido','cancelado') NOT NULL DEFAULT 'reservado',
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_product (product_id),
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;
