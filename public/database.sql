-- Skrip Database MySQL untuk Modul Ajar Berbasis Cinta (Plesk / cPanel / phpMyAdmin)
-- Nama Database Default: jaenal_modulajar
-- Nama User Default: jaenal_modulajar
-- Password Default: masbagus15

CREATE DATABASE IF NOT EXISTS `jaenal_modulajar`;
USE `jaenal_modulajar`;

CREATE TABLE IF NOT EXISTS `kbc_mi_app_settings` (
  `madrasah_id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `data` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
