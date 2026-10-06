-- ============================================================================
-- DATABASE DUMP & SKEMA RELASIONAL: MONITOR KAS KECIL BENGKEL
-- Entitas Bisnis: Shop & Drive & Bima Motor / PT DUTARAYA BERJAYA
-- Tanggal Ekspor : 2026-10-06T02:58:14.784Z
-- Format Data    : MySQL / MariaDB / PostgreSQL / SQLite Compatible DDL & DML
-- Karakter Set   : UTF-8 (utf8mb4)
-- Total Record   : 35 Catatan Kas Harian | 19 Transaksi Rekening Mandiri
-- ============================================================================

-- 1. INISIALISASI DATABASE (MySQL / MariaDB)
CREATE DATABASE IF NOT EXISTS db_kas_bengkel 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE db_kas_bengkel;

-- Nonaktifkan sementara validasi foreign key saat proses dump
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- STRUKTUR TABEL 1: tbl_rekap_kas
-- Pembukuan kas kecil harian, omset toko, non-tunai, dan selisih laci
-- ============================================================================
DROP TABLE IF EXISTS tbl_rekap_kas;
CREATE TABLE tbl_rekap_kas (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID Unik Record (contoh: REC-20261005-1058)',
  tanggal DATE NOT NULL COMMENT 'Tanggal rekapitulasi shift kasir (YYYY-MM-DD)',
  kasir VARCHAR(100) NOT NULL COMMENT 'Nama kasir yang bertugas / shift',
  saldo_awal DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Modal uang kas kecil awal hari',
  penjualan_shop_drive DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total penjualan omset Shop & Drive',
  penjualan_bima_motor DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total penjualan omset Bima Motor',
  pemasukan_lain DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Pemasukan tambahan (jasa derek, scrap aki, oli bekas)',
  keterangan_pemasukan_lain TEXT DEFAULT NULL COMMENT 'Keterangan sumber pemasukan lain',
  total_pemasukan DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: Penjualan SD + BM + Pemasukan Lain',
  transfer_mandiri DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Pembayaran pelanggan via Transfer Bank Mandiri',
  card_edc DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Pembayaran pelanggan via Kartu Debit / EDC',
  penghematan_trade_in DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Diskon / Tukar tambah (Trade In) aki',
  biaya_operasional DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total pengeluaran operasional toko / kasir',
  total_pengeluaran_kas DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: Transfer + EDC + Trade In + Biaya Ops',
  sisa_uang_kas_kecil DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: (Saldo Awal + Total Pemasukan) - Total Pengeluaran',
  fisik_riil DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Uang fisik riil hasil hitung di laci kasir',
  selisih DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: Fisik Riil - Sisa Kas Kecil (0 = Pas)',
  sudah_diambil TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Belum Diambil, 1: Sudah Diambil Owner',
  catatan TEXT DEFAULT NULL COMMENT 'Catatan serah terima kasir / keterangan',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu penyimpanan record',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tanggal (tanggal),
  INDEX idx_kasir (kasir),
  INDEX idx_status_diambil (sudah_diambil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Data Harian Kas Kecil Bengkel';

-- ============================================================================
-- STRUKTUR TABEL 2: tbl_rincian_pengeluaran
-- Rincian bon pengeluaran operasional (bensin, makan, sparepart, dll)
-- ============================================================================
DROP TABLE IF EXISTS tbl_rincian_pengeluaran;
CREATE TABLE tbl_rincian_pengeluaran (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rekap_kas_id VARCHAR(50) NOT NULL COMMENT 'Relasi ke tbl_rekap_kas(id)',
  keterangan VARCHAR(255) NOT NULL COMMENT 'Keterangan pengeluaran',
  nominal DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Besaran nominal pengeluaran (Rp)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rekap_id (rekap_kas_id),
  CONSTRAINT fk_rincian_rekap_kas FOREIGN KEY (rekap_kas_id) 
    REFERENCES tbl_rekap_kas (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Rincian Pengeluaran Operasional';

-- ============================================================================
-- STRUKTUR TABEL 3: tbl_transaksi_bank
-- Rekening Koran Mandiri: Restok Bahan Bengkel, Penarikan, dan Inflow
-- ============================================================================
DROP TABLE IF EXISTS tbl_transaksi_bank;
CREATE TABLE tbl_transaksi_bank (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID Transaksi Bank (RESTOK-xxx / TARIK-xxx)',
  type ENUM('restok', 'penarikan', 'inflow') NOT NULL COMMENT 'Jenis transaksi',
  tanggal DATE NOT NULL COMMENT 'Tanggal transaksi bank (YYYY-MM-DD)',
  supplier VARCHAR(150) DEFAULT NULL COMMENT 'Supplier / Toko Bahan (AOP, GS Astra, dll)',
  kategori VARCHAR(100) DEFAULT NULL COMMENT 'Kategori barang / jenis pengeluaran',
  nota VARCHAR(100) DEFAULT NULL COMMENT 'Nomor nota / invoice faktur',
  nama VARCHAR(150) DEFAULT NULL COMMENT 'Nama item bahan atau keperluan restok',
  keterangan TEXT DEFAULT NULL COMMENT 'Keterangan lengkap transaksi',
  penerima VARCHAR(150) DEFAULT NULL COMMENT 'Penerima penarikan dana',
  nominal DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal dana keluar/masuk (Rp)',
  status_owner ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'pending' COMMENT 'Status validasi owner (PIN 2209)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bank_tanggal (tanggal),
  INDEX idx_bank_type (type),
  INDEX idx_bank_status (status_owner)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Buku Kas Rekening Bank Mandiri & Restok';

-- ============================================================================
-- STRUKTUR TABEL 4: tbl_pengaturan_sistem
-- Konfigurasi sistem, saldo awal rekening, saldo bulan lalu, PIN proteksi
-- ============================================================================
DROP TABLE IF EXISTS tbl_pengaturan_sistem;
CREATE TABLE tbl_pengaturan_sistem (
  setting_key VARCHAR(50) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL,
  deskripsi VARCHAR(255) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Konfigurasi Sistem Kas Bengkel';

-- ============================================================================
-- DATA ISIAN (DML / INSERT DATA)
-- ============================================================================

-- A. Data Isian Pengaturan Sistem
INSERT INTO tbl_pengaturan_sistem (setting_key, setting_value, deskripsi) VALUES
('bengkel_name', 'Shop & Drive & Bima Motor', 'Nama bengkel / unit bisnis'),
('default_kasir', 'Adis Setiawan', 'Kasir default'),
('rekening_mandiri_name', 'Bank Mandiri - 1560023250204', 'Nama rekening operasional bank'),
('owner_name', 'PT DUTARAYA BERJAYA', 'Nama pemilik bengkel / perusahaan'),
('pin_owner', '2209', 'PIN verifikasi owner untuk validasi status kas & rekening'),
('saldo_awal_rekening', '0', 'Saldo awal buku rekening bank mandiri'),
('saldo_bulan_lalu', '29384422', 'Saldo buku rekening bulan lalu');

-- B. Data Isian Rekap Kas Harian (Total: 35 Records)
INSERT INTO tbl_rekap_kas (
  id, tanggal, kasir, saldo_awal, 
  penjualan_shop_drive, penjualan_bima_motor, pemasukan_lain, keterangan_pemasukan_lain, total_pemasukan,
  transfer_mandiri, card_edc, penghematan_trade_in, biaya_operasional, total_pengeluaran_kas,
  sisa_uang_kas_kecil, fisik_riil, selisih, sudah_diambil, catatan, created_at
) VALUES
('REC-20261005-1058', '2026-10-05', 'Satria jaka Surya', 0, 12428920, 100000, 1200000, 'Penjualan Oli Bekas', 13728920, 2395000, 5316910, 705000, 0, 8416910, 5312010, 5312000, -10, 1, '', '2026-10-06 00:22:01'),
('REC-20261004-3714', '2026-10-04', 'Satria jaka Surya', 0, 24767540, 540000, 0, '', 25307540, 1680500, 18819530, 2210000, 1150000, 23860030, 1447510, 1447500, -10, 1, '', '2026-10-06 00:15:43'),
('REC-20261003-8456', '2026-10-03', 'Adis Setiawan', 0, 19374030, 520000, 0, '', 19894030, 500000, 11974030, 593000, 20000, 13087030, 6807000, 6807000, 0, 1, '', '2026-10-06 00:12:48'),
('REC-20261002-5865', '2026-10-02', 'Satria jaka Surya', 0, 7747510, 80000, 0, '', 7827510, 0, 6565510, 394000, 0, 6959510, 868000, 868000, 0, 1, '', '2026-10-06 00:10:45'),
('REC-20261001-9643', '2026-10-01', 'Adis Setiawan', 0, 11853030, 0, 0, '', 11853030, 3601010, 5289000, 577000, 190000, 9657010, 2196020, 2196000, -20, 1, '', '2026-10-06 00:08:49'),
('REC-20260930-5770', '2026-09-30', 'Adis Setiawan', 0, 13128020, 250000, 0, '', 13378020, 3601010, 9035010, 492000, 100000, 13228020, 150000, 150000, 0, 1, '', '2026-10-06 00:06:25'),
('REC-20260929-9983', '2026-09-29', 'Adis Setiawan', 0, 11137020, 0, 0, '', 11137020, 0, 7744020, 602000, 144000, 8490020, 2647000, 2647000, 0, 1, '', '2026-10-06 00:03:49'),
('REC-20260928-9465', '2026-09-28', 'Satria jaka Surya', 0, 13981030, 0, 0, '', 13981030, 1935000, 9708010, 980000, 78000, 12701010, 1280020, 1280000, -20, 1, '', '2026-10-05 23:58:19'),
('REC-20260927-9362', '2026-09-27', 'Adis Setiawan', 0, 16896050, 0, 0, '', 16896050, 2575010, 12593520, 1362000, 0, 16530530, 365520, 365520, 0, 1, '', '2026-10-05 23:53:49'),
('REC-20260926-9937', '2026-09-26', 'Adis Setiawan', 0, 15411530, 0, 0, '', 15411530, 1865000, 9592520, 944000, 41500, 12443020, 2968510, 2968510, 0, 1, '', '2026-10-05 23:41:39'),
('REC-20260925-5992', '2026-09-25', 'Adis Setiawan', 0, 3819000, 0, 0, '', 3819000, 358000, 2934500, 0, 0, 3292500, 526500, 526500, 0, 1, '', '2026-10-05 23:35:45'),
('REC-1791242000785', '2026-09-24', 'Satria jaka Surya', 0, 5089040, 0, 0, '', 5089040, 772000, 3761030, 493000, 0, 5026030, 63010, 63000, -10, 1, '', '2026-10-05 23:13:20'),
('REC-1791241793408', '2026-09-23', 'Adis Setiawan', 0, 10111530, 400000, 0, '', 10511530, 807000, 7762520, 492000, 0, 9061520, 1450010, 1450000, -10, 1, '', '2026-10-05 23:10:13'),
('REC-1791239697215', '2026-09-22', 'Satria jaka Surya', 0, 17400040, 260000, 0, '', 17660040, 4925020, 11440020, 1143000, 20000, 17528040, 132000, 132000, 0, 1, '', '2026-10-05 22:35:44'),
('REC-1789996551365', '2026-09-21', 'Adis Setiawan', 0, 13465030, 400000, 0, '', 13865030, 0, 6556520, 835000, 3226500, 10618020, 3247010, 3247500, 490, 1, '', '2026-09-22 11:13:16'),
('REC-1789956130028', '2026-09-20', 'Adis Setiawan', 0, 14488550, 100000, 0, '', 14588550, 2237020, 10971030, 1389000, 60000, 14657050, -68500, 0, 68500, 1, '', '2026-09-21 02:02:10'),
('REC-1789955734372', '2026-09-19', 'Adis', 0, 10429030, 300000, 0, '', 10729030, 0, 8983020, 554000, 20000, 9557020, 1172010, 1172000, -10, 1, '', '2026-09-21 01:55:34'),
('REC-1789955861700', '2026-09-18', 'Adis Setiawan', 0, 7558020, 0, 0, '', 7558020, 1921010, 4494010, 357000, 50000, 6822020, 736000, 736000, 0, 1, '', '2026-09-21 01:57:41'),
('REC-1789654273220', '2026-09-17', 'Adis Setiawan', 0, 9812520, 400000, 0, '', 10212520, 3247000, 4889510, 397000, 115000, 8648510, 1564010, 1564000, -10, 1, '', '2026-09-17 14:11:13'),
('REC-1789604109532', '2026-09-16', 'Kasir', 0, 4429500, 200000, 0, '', 4629500, 2684500, 1743000, 202000, 0, 4629500, 0, 0, 0, 1, '', '2026-09-17 00:15:09'),
('REC-1789529482044', '2026-09-15', 'Surya', 0, 8822020, 100000, 0, '', 8922020, 135500, 5714510, 910000, 0, 6760010, 2162010, 2162000, -10, 1, '', '2026-09-16 03:31:22'),
('REC-1789391132957', '2026-09-14', 'Adis Setiawan', 0, 11267000, 200000, 0, '', 11467000, 5155010, 4367000, 586000, 100000, 10208010, 1258990, 1258900, -90, 1, '', '2026-09-14 13:05:32'),
('REC-1789308029651', '2026-09-13', 'Adis Setiawan', 0, 18319530, 500000, 0, '', 18819530, 514000, 16783510, 862000, 75000, 18234510, 585020, 585000, -20, 1, '', '2026-09-13 14:00:29'),
('REC-1789309165009', '2026-09-12', 'Kasir', 0, 19063058, 600000, 0, '', 19663058, 3109010, 15050540, 1316000, 30000, 19505550, 157508, 158500, 992, 1, '', '2026-09-13 14:19:25'),
('REC-1789301578709', '2026-09-11', 'Kasir', 0, 13140040, 100000, 0, '', 13240040, 0, 10482020, 783000, 0, 11265020, 1975020, 1975000, -20, 1, '', '2026-09-13 12:12:58'),
('REC-1789301495996', '2026-09-10', 'Kasir', 0, 12429640, 200000, 0, '', 12629640, 1316000, 10151640, 769000, 20000, 12256640, 373000, 373000, 0, 1, '', '2026-09-13 12:11:35'),
('REC-1789301399517', '2026-09-09', 'Kasir', 0, 7429040, 200000, 0, '', 7629040, 0, 6777040, 652000, 0, 7429040, 200000, 200000, 0, 1, '', '2026-09-13 12:09:59'),
('REC-1789301326469', '2026-09-08', 'Kasir', 0, 10329050, 200000, 0, '', 10529050, 3928010, 3984510, 579000, 130000, 8621520, 1907530, 1907500, -30, 1, '', '2026-09-13 12:08:46'),
('REC-1789301198318', '2026-09-07', 'Kasir', 0, 12209020, 500000, 0, '', 12709020, 1226000, 8437000, 622000, 2381000, 12666000, 43020, 43000, -20, 1, '', '2026-09-13 12:06:38'),
('REC-1789301092596', '2026-09-06', 'Kasir', 0, 10231510, 300000, 0, '', 10531510, 0, 9836510, 695000, 0, 10531510, 0, 0, 0, 1, '', '2026-09-13 12:04:52'),
('REC-1789301019285', '2026-09-05', 'Kasir', 0, 23956530, 200000, 0, '', 24156530, 4842010, 17243520, 1093000, 165000, 23343530, 813000, 813000, 0, 1, '', '2026-09-13 12:03:39'),
('REC-1789300880459', '2026-09-04', 'Kasir', 0, 9938010, 0, 0, '', 9938010, 7316010, 1730000, 265000, 35000, 9346010, 592000, 592000, 0, 1, '', '2026-09-13 12:01:20'),
('REC-1789300775446', '2026-09-03', 'Kasir', 0, 7771010, 0, 0, '', 7771010, 2096510, 4279500, 648000, 210000, 7234010, 537000, 537000, 0, 1, '', '2026-09-13 11:59:35'),
('REC-1789301941852', '2026-09-02', 'Kasir', 0, 8057020, 0, 0, '', 8057020, 2264000, 3994510, 488000, 0, 6746510, 1310510, 1310500, -10, 1, '', '2026-09-13 12:19:01'),
('REC-1789300563188', '2026-09-01', 'Kasir', 0, 9387520, 0, 0, '', 9387520, 544500, 7100020, 585000, 75000, 8304520, 1083000, 1083000, 0, 1, '', '2026-09-13 11:56:03');

-- C. Data Isian Rincian Biaya Operasional Kas (Total: 32 Rincian Bon)
INSERT INTO tbl_rincian_pengeluaran (rekap_kas_id, keterangan, nominal) VALUES
('REC-20261004-3714', 'Operasional', 1150000),
('REC-20261003-8456', 'Operasional', 20000),
('REC-20261001-9643', 'Operasional', 190000),
('REC-20260930-5770', 'Operasional', 100000),
('REC-20260929-9983', 'Operasional', 144000),
('REC-20260928-9465', 'Operasional', 78000),
('REC-20260926-9937', 'Operasional', 41500),
('REC-1791239697215', 'Bensin', 20000),
('REC-1789996551365', 'Peralatan', 1126500),
('REC-1789996551365', 'Bayar Listrik September', 2100000),
('REC-1789956130028', 'Bensin BHD', 40000),
('REC-1789956130028', 'Isolasi', 20000),
('REC-1789955734372', 'Lem campur', 20000),
('REC-1789955861700', 'Bensin BHD/DOI', 50000),
('REC-1789654273220', 'Tagihan kartu simpati', 115000),
('REC-1789391132957', 'Iuran Bulanan RT', 100000),
('REC-1789308029651', 'Sabun Pel', 45000),
('REC-1789308029651', 'Minyak BHD', 30000),
('REC-1789309165009', 'Bensin BHD', 30000),
('REC-1789301495996', 'Minyak BHD', 20000),
('REC-1789301326469', 'Air Gun Kompressor', 100000),
('REC-1789301326469', 'Bensin BHD', 30000),
('REC-1789301198318', 'Transfer PT Afta 2 September ', 2381000),
('REC-1789301019285', 'Cetak Spanduk Aki', 100000),
('REC-1789301019285', 'Bensin BHD', 40000),
('REC-1789301019285', 'Sabun Pel', 25000),
('REC-1789300880459', 'Air Galon ', 35000),
('REC-1789300775446', 'Bensin BHD', 20000),
('REC-1789300775446', 'BPJS Rengga', 190000),
('REC-1789300563188', 'Motor BHD', 15000),
('REC-1789300563188', 'Minyak BHD', 40000),
('REC-1789300563188', 'Sabun Pel', 20000);

-- D. Data Isian Transaksi Bank Mandiri (Total: 19 Transaksi Riil Restok & Penarikan)
INSERT INTO tbl_transaksi_bank (
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

-- ============================================================================
-- VIEW LAPORAN & ANALISIS KEUANGAN (SQL VIEWS)
-- ============================================================================

-- View 1: Ringkasan Status Kas Harian
CREATE OR REPLACE VIEW v_ringkasan_kas_harian AS
SELECT 
  id,
  tanggal,
  kasir,
  saldo_awal,
  total_pemasukan,
  total_pengeluaran_kas,
  sisa_uang_kas_kecil,
  fisik_riil,
  selisih,
  CASE 
    WHEN selisih = 0 THEN 'PAS (SESUAI)'
    WHEN selisih > 0 THEN CONCAT('LEBIH (+Rp ', FORMAT(selisih, 0), ')')
    ELSE CONCAT('KURANG (-Rp ', FORMAT(ABS(selisih), 0), ')')
  END AS status_selisih,
  CASE 
    WHEN sudah_diambil = 1 THEN 'SUDAH DIAMBIL OWNER'
    ELSE 'BELUM DIAMBIL'
  END AS status_pengambilan,
  catatan
FROM tbl_rekap_kas
ORDER BY tanggal DESC;

-- View 2: Rekapitulasi Akumulasi Bulanan
CREATE OR REPLACE VIEW v_rekap_bulanan AS
SELECT 
  DATE_FORMAT(tanggal, '%Y-%m') AS periode_bulan,
  COUNT(id) AS jumlah_hari_kerja,
  SUM(penjualan_shop_drive) AS total_penjualan_shop_drive,
  SUM(penjualan_bima_motor) AS total_penjualan_bima_motor,
  SUM(pemasukan_lain) AS total_pemasukan_lain,
  SUM(total_pemasukan) AS total_omset_kotor,
  SUM(transfer_mandiri) AS total_transfer_mandiri,
  SUM(card_edc) AS total_card_edc,
  SUM(penghematan_trade_in) AS total_trade_in,
  SUM(biaya_operasional) AS total_biaya_operasional,
  SUM(total_pengeluaran_kas) AS total_pengeluaran,
  SUM(sisa_uang_kas_kecil) AS total_sisa_kas_kecil
FROM tbl_rekap_kas
GROUP BY DATE_FORMAT(tanggal, '%Y-%m')
ORDER BY periode_bulan DESC;

-- View 3: Monitoring Aliran Kas Rekening Mandiri
CREATE OR REPLACE VIEW v_monitoring_rekening_mandiri AS
SELECT 
  k.tanggal,
  SUM(k.transfer_mandiri) AS inflow_transfer_mandiri,
  SUM(k.card_edc) AS inflow_card_edc,
  SUM(k.transfer_mandiri + k.card_edc) AS total_inflow_non_tunai,
  COALESCE((SELECT SUM(b.nominal) FROM tbl_transaksi_bank b WHERE b.tanggal = k.tanggal AND b.type = 'restok'), 0) AS outflow_restok_bahan,
  COALESCE((SELECT SUM(b.nominal) FROM tbl_transaksi_bank b WHERE b.tanggal = k.tanggal AND b.type = 'penarikan'), 0) AS outflow_penarikan_lain
FROM tbl_rekap_kas k
GROUP BY k.tanggal
ORDER BY k.tanggal DESC;

-- Kembalikan pengecekan foreign key
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SELESAI. Dump SQL berhasil digenerate dengan seluruh data riil lokal sistem.
-- ============================================================================
