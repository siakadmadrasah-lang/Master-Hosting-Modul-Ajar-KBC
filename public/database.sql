-- Skrip Database MySQL untuk Modul Ajar Berbasis Cinta (cPanel / Plesk / phpMyAdmin)
-- Nama Database Default: masbagoes_modulajar
-- Nama User Default: masbagoes_modulajar
-- Password Default: masbagus15

CREATE DATABASE IF NOT EXISTS `masbagoes_modulajar`;
USE `masbagoes_modulajar`;

CREATE TABLE IF NOT EXISTS `kbc_mi_app_settings` (
  `madrasah_id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `data` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
