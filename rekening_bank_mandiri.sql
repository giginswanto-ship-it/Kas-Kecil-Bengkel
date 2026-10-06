-- ============================================================================
-- SQL DUMP KHUSUS: REKENING BANK MANDIRI & RESTOK BAHAN
-- PT DUTARAYA BERJAYA - SHOP & DRIVE & BIMA MOTOR
-- No. Rekening   : 1560023250204
-- Tanggal Ekspor : 2026-10-06T13:15:01.614Z
-- Total Transaksi: 19 Transaksi Outflow/Restok | 36 Hari Inflow Kasir
-- ============================================================================

CREATE DATABASE IF NOT EXISTS db_kas_bengkel 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE db_kas_bengkel;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. TABEL PENGATURAN & SALDO AWAL REKENING MANDIRI
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS tbl_bank_mandiri_settings;
CREATE TABLE tbl_bank_mandiri_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_name VARCHAR(100) NOT NULL DEFAULT 'Bank Mandiri - 1560023250204',
  owner_name VARCHAR(100) NOT NULL DEFAULT 'PT DUTARAYA BERJAYA',
  bengkel_name VARCHAR(150) NOT NULL DEFAULT 'Shop & Drive & Bima Motor',
  saldo_awal DECIMAL(15, 2) NOT NULL DEFAULT 29384422.00 COMMENT 'Saldo Awal Rekening Koran Mandiri',
  saldo_bulan_lalu DECIMAL(15, 2) NOT NULL DEFAULT 29384422.00,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pengaturan & Saldo Awal Rekening Mandiri';

INSERT INTO tbl_bank_mandiri_settings (account_name, owner_name, bengkel_name, saldo_awal, saldo_bulan_lalu)
VALUES ('Bank Mandiri - 1560023250204', 'PT DUTARAYA BERJAYA', 'Shop & Drive & Bima Motor', 29384422, 29384422);

-- ----------------------------------------------------------------------------
-- 2. TABEL TRANSAKSI MUTASI BANK MANDIRI (RESTOK & PENARIKAN LAIN)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS tbl_bank_mandiri_transactions;
CREATE TABLE tbl_bank_mandiri_transactions (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID Unik (TARIK-xxx / RESTOK-xxx)',
  type ENUM('restok', 'penarikan', 'inflow') NOT NULL COMMENT 'Jenis mutasi',
  tanggal DATE NOT NULL COMMENT 'Tanggal transaksi bank',
  supplier VARCHAR(150) DEFAULT NULL COMMENT 'Supplier bahan (AOP, dsb)',
  kategori VARCHAR(100) DEFAULT NULL COMMENT 'Kategori pengeluaran / bahan',
  nota VARCHAR(100) DEFAULT NULL COMMENT 'Nomor nota / invoice',
  nama VARCHAR(150) DEFAULT NULL COMMENT 'Nama item bahan / keperluan',
  keterangan TEXT DEFAULT NULL COMMENT 'Uraian keterangan transaksi',
  penerima VARCHAR(150) DEFAULT NULL COMMENT 'Pihak penerima transfer',
  nominal DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal dana keluar (Rp)',
  status_owner ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'approved' COMMENT 'Validasi Owner',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bank_tanggal (tanggal),
  INDEX idx_bank_type (type),
  INDEX idx_bank_status (status_owner)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daftar Transaksi Rekening Mandiri';

INSERT INTO tbl_bank_mandiri_transactions (
  id, type, tanggal, supplier, kategori, nota, nama, keterangan, penerima, nominal, status_owner, created_at
) VALUES
('TARIK-1791248415217', 'penarikan', '2026-10-02', NULL, 'Prive / Bagi Hasil Owner', NULL, NULL, 'Prive Mingguan', 'Bp Swanto mandiri', 4500000, 'approved', '2026-10-06 01:00:15'),
('TARIK-1791248372626', 'penarikan', '2026-10-01', NULL, 'Gaji & Insentif Karyawan', NULL, NULL, 'Insentip Fera Pajak', 'BCA Fera Ferdianti', 1500000, 'approved', '2026-10-06 00:59:32'),
('TARIK-1791248043056', 'penarikan', '2026-09-30', NULL, 'Prive / Bagi Hasil Owner', NULL, NULL, 'Pembelian PC Untuk Server', 'BCA Ashabil Syauqi Snaprint GW', 7000000, 'approved', '2026-10-06 00:54:03'),
('RESTOK-1791247927128', 'restok', '2026-09-28', 'AOP', 'Aki & Baterai', '', 'Barang dagangan Shop And Drive', NULL, NULL, 31743686, 'approved', '2026-10-06 00:52:07'),
('TARIK-1791247821065', 'penarikan', '2026-09-28', NULL, 'Keperluan Darurat / Lainnya', NULL, NULL, '??', '', 10073761, 'pending', '2026-10-06 00:50:21'),
('TARIK-1791247688249', 'penarikan', '2026-09-27', NULL, 'Prive / Bagi Hasil Owner', NULL, NULL, 'Prive cicilan Hutang', 'Rek Mandiri Bp Swanto', 7500000, 'approved', '2026-10-06 00:48:08'),
('TARIK-1791247614888', 'penarikan', '2026-09-27', NULL, 'Gaji & Insentif Karyawan', NULL, NULL, 'Bayar Gaji', 'Adis Setiawan ( kepala Toko )', 12830000, 'approved', '2026-10-06 00:46:54'),
('TARIK-1790076045480', 'penarikan', '2026-09-22', NULL, 'Biaya Admin / Bunga Bank', NULL, NULL, 'Biaya Listrik dan Beli peralatan cek aki', '', 3226500, 'approved', '2026-09-22 11:20:45'),
('TARIK-1789956583708', 'penarikan', '2026-09-06', NULL, 'Prive / Bagi Hasil Owner', NULL, NULL, 'Belanja Peralatan', 'SAEFUDIN', 2000000, 'approved', '2026-09-21 02:09:43'),
('RESTOK-1789956528819', 'restok', '2026-09-06', 'AOP', 'Aki & Baterai', '', 'Belanja Barang Dagangan', NULL, NULL, 57723505, 'approved', '2026-09-21 02:08:48'),
('TARIK-1789956438284', 'penarikan', '2026-09-02', NULL, 'Biaya Admin / Bunga Bank', NULL, NULL, 'Biaya Bulanan Rekening', 'Bank Mandiri', 10500, 'approved', '2026-09-21 02:07:18'),
('TARIK-1789954072788', 'penarikan', '2026-09-20', NULL, 'Pajak & Legalitas', NULL, NULL, 'PPH Final badan Agst 2026', 'DJP', 1188870, 'approved', '2026-09-21 01:27:52'),
('TARIK-1789954022540', 'penarikan', '2026-09-20', NULL, 'Pajak & Legalitas', NULL, NULL, 'DJP', 'PPN Agustus 2026', 4664545, 'approved', '2026-09-21 01:27:02'),
('TARIK-1789953971068', 'penarikan', '2026-09-20', NULL, 'Pajak & Legalitas', NULL, NULL, 'PPH21', 'DJP', 91250, 'approved', '2026-09-21 01:26:11'),
('TARIK-1789953898836', 'penarikan', '2026-09-18', NULL, 'Biaya Admin / Bunga Bank', NULL, NULL, 'Biaya admin', '', 2500, 'approved', '2026-09-21 01:24:58'),
('TARIK-1789953843524', 'penarikan', '2026-09-18', NULL, 'Keperluan Darurat / Lainnya', NULL, NULL, 'Tarikan Kas untuk beli Oli tambahan', 'KARTIKA', 14450000, 'approved', '2026-09-21 01:24:03'),
('TARIK-1789953728437', 'penarikan', '2026-09-14', NULL, 'Prive / Bagi Hasil Owner', NULL, NULL, 'Penarikan Owner', 'Mandiri 1560004534105', 20000000, 'approved', '2026-09-21 01:22:08'),
('RESTOK-1789953644394', 'restok', '2026-09-14', 'AOP', 'Aki & Baterai', '', 'Barang dagangan Shop & Drive', NULL, NULL, 66297436, 'approved', '2026-09-21 01:20:44'),
('RESTOK-1789953299477', 'restok', '2026-09-21', 'AOP', 'Sparepart & Onderdil', '', 'Barang dagangan Shop And Drive', NULL, NULL, 58324089, 'approved', '2026-09-21 01:14:59');

-- ----------------------------------------------------------------------------
-- 3. TABEL INFLOW NON-TUNAI KASIR KE MANDIRI (TRANSFER + EDC)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS tbl_bank_mandiri_inflow_kasir;
CREATE TABLE tbl_bank_mandiri_inflow_kasir (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID Relasi Kas Harian',
  tanggal DATE NOT NULL COMMENT 'Tanggal Transaksi Kasir',
  kasir VARCHAR(100) NOT NULL COMMENT 'Nama Kasir Bertugas',
  transfer_mandiri DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Inflow Transfer Mandiri Pelanggan',
  card_edc DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Inflow Card / EDC Pelanggan',
  total_inflow_bank DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total Dana Masuk ke Rekening Mandiri',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Aliran Dana Non-Tunai Masuk ke Bank Mandiri';

INSERT INTO tbl_bank_mandiri_inflow_kasir (
  id, tanggal, kasir, transfer_mandiri, card_edc, total_inflow_bank, created_at
) VALUES
('REC-20261006-7866', '2026-10-06', 'Adis Setiawan', 0, 8222020, 8222020, '2026-10-06 12:05:47'),
('REC-20261005-1058', '2026-10-05', 'Satria jaka Surya', 2395000, 5316910, 7711910, '2026-10-06 00:22:01'),
('REC-20261004-3714', '2026-10-04', 'Satria jaka Surya', 1680500, 18819530, 20500030, '2026-10-06 00:15:43'),
('REC-20261003-8456', '2026-10-03', 'Adis Setiawan', 500000, 11974030, 12474030, '2026-10-06 00:12:48'),
('REC-20261002-5865', '2026-10-02', 'Satria jaka Surya', 0, 6565510, 6565510, '2026-10-06 00:10:45'),
('REC-20261001-9643', '2026-10-01', 'Adis Setiawan', 3601010, 5289000, 8890010, '2026-10-06 00:08:49'),
('REC-20260930-5770', '2026-09-30', 'Adis Setiawan', 3601010, 9035010, 12636020, '2026-10-06 00:06:25'),
('REC-20260929-9983', '2026-09-29', 'Adis Setiawan', 0, 7744020, 7744020, '2026-10-06 00:03:49'),
('REC-20260928-9465', '2026-09-28', 'Satria jaka Surya', 1935000, 9708010, 11643010, '2026-10-05 23:58:19'),
('REC-20260927-9362', '2026-09-27', 'Adis Setiawan', 2575010, 12593520, 15168530, '2026-10-05 23:53:49'),
('REC-20260926-9937', '2026-09-26', 'Adis Setiawan', 1865000, 9592520, 11457520, '2026-10-05 23:41:39'),
('REC-20260925-5992', '2026-09-25', 'Adis Setiawan', 0, 8222020, 8222020, '2026-10-06 12:04:15'),
('REC-1791242000785', '2026-09-24', 'Satria jaka Surya', 772000, 3761030, 4533030, '2026-10-05 23:13:20'),
('REC-1791241793408', '2026-09-23', 'Adis Setiawan', 807000, 7762520, 8569520, '2026-10-05 23:10:13'),
('REC-1791239697215', '2026-09-22', 'Satria jaka Surya', 4925020, 11440020, 16365040, '2026-10-05 22:35:44'),
('REC-1789996551365', '2026-09-21', 'Adis Setiawan', 0, 6556520, 6556520, '2026-09-22 11:13:16'),
('REC-1789956130028', '2026-09-20', 'Adis Setiawan', 2237020, 10971030, 13208050, '2026-09-21 02:02:10'),
('REC-1789955734372', '2026-09-19', 'Adis', 0, 8983020, 8983020, '2026-09-21 01:55:34'),
('REC-1789955861700', '2026-09-18', 'Adis Setiawan', 1921010, 4494010, 6415020, '2026-09-21 01:57:41'),
('REC-1789654273220', '2026-09-17', 'Adis Setiawan', 3247000, 4889510, 8136510, '2026-09-17 14:11:13'),
('REC-1789604109532', '2026-09-16', 'Kasir', 2684500, 1743000, 4427500, '2026-09-17 00:15:09'),
('REC-1789529482044', '2026-09-15', 'Surya', 135500, 5714510, 5850010, '2026-09-16 03:31:22'),
('REC-1789391132957', '2026-09-14', 'Adis Setiawan', 5155010, 4367000, 9522010, '2026-09-14 13:05:32'),
('REC-1789308029651', '2026-09-13', 'Adis Setiawan', 514000, 16783510, 17297510, '2026-09-13 14:00:29'),
('REC-1789309165009', '2026-09-12', 'Kasir', 3109010, 15050540, 18159550, '2026-09-13 14:19:25'),
('REC-1789301578709', '2026-09-11', 'Kasir', 0, 10482020, 10482020, '2026-09-13 12:12:58'),
('REC-1789301495996', '2026-09-10', 'Kasir', 1316000, 10151640, 11467640, '2026-09-13 12:11:35'),
('REC-1789301399517', '2026-09-09', 'Kasir', 0, 6777040, 6777040, '2026-09-13 12:09:59'),
('REC-1789301326469', '2026-09-08', 'Kasir', 3928010, 3984510, 7912520, '2026-09-13 12:08:46'),
('REC-1789301198318', '2026-09-07', 'Kasir', 1226000, 8437000, 9663000, '2026-09-13 12:06:38'),
('REC-1789301092596', '2026-09-06', 'Kasir', 0, 9836510, 9836510, '2026-09-13 12:04:52'),
('REC-1789301019285', '2026-09-05', 'Kasir', 4842010, 17243520, 22085530, '2026-09-13 12:03:39'),
('REC-1789300880459', '2026-09-04', 'Kasir', 7316010, 1730000, 9046010, '2026-09-13 12:01:20'),
('REC-1789300775446', '2026-09-03', 'Kasir', 2096510, 4279500, 6376010, '2026-09-13 11:59:35'),
('REC-1789301941852', '2026-09-02', 'Kasir', 2264000, 3994510, 6258510, '2026-09-13 12:19:01'),
('REC-1789300563188', '2026-09-01', 'Kasir', 544500, 7100020, 7644520, '2026-09-13 11:56:03');

-- ----------------------------------------------------------------------------
-- 4. VIEW REKONSILIASI & PERKIRAAN SALDO BANK MANDIRI
-- Rumus: Saldo Awal + Total Inflow Kasir - (Total Restok + Total Penarikan)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_rekening_mandiri_rekonsiliasi AS
SELECT 
  (SELECT saldo_awal FROM tbl_bank_mandiri_settings LIMIT 1) AS saldo_awal_bank,
  (SELECT COALESCE(SUM(total_inflow_bank), 0) FROM tbl_bank_mandiri_inflow_kasir) AS total_inflow_kasir,
  (SELECT COALESCE(SUM(nominal), 0) FROM tbl_bank_mandiri_transactions WHERE type = 'restok') AS total_restok_bahan,
  (SELECT COALESCE(SUM(nominal), 0) FROM tbl_bank_mandiri_transactions WHERE type = 'penarikan') AS total_penarikan_lain,
  (
    (SELECT saldo_awal FROM tbl_bank_mandiri_settings LIMIT 1)
    + (SELECT COALESCE(SUM(total_inflow_bank), 0) FROM tbl_bank_mandiri_inflow_kasir)
    - (SELECT COALESCE(SUM(nominal), 0) FROM tbl_bank_mandiri_transactions)
  ) AS perkiraan_saldo_akhir_bank;

SET FOREIGN_KEY_CHECKS = 1;
