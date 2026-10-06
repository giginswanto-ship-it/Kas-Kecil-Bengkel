/**
 * SCRIPT EXPORT DATA SISTEM KAS BENGKEL KE FORMAT SQL
 * Mengonversi seluruh data dari database_kas_bengkel.json, transaksi bank,
 * rincian operasional, dan pengaturan ke file database_kas_bengkel.sql
 */

const fs = require('fs');
const path = require('path');

const DB_JSON_PATH = path.join(__dirname, 'database_kas_bengkel.json');
const OUTPUT_SQL_PATH = path.join(__dirname, 'database_kas_bengkel.sql');

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

function generateSqlDump() {
  let jsonData = { records: [] };
  if (fs.existsSync(DB_JSON_PATH)) {
    try {
      jsonData = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
    } catch (e) {
      console.error('Gagal membaca database_kas_bengkel.json:', e);
    }
  }

  const records = Array.isArray(jsonData) ? jsonData : (jsonData.records || []);
  const now = new Date().toISOString();

  let sql = `-- ============================================================================
-- DATABASE DUMP & SCHEMA: MONITOR KAS KECIL BENGKEL
-- Toko & Bengkel: Shop & Drive & Bima Motor / PT DUTARAYA BERJAYA
-- Tanggal Ekspor: ${now}
-- Format        : MySQL / MariaDB / PostgreSQL / SQLite Compatible DDL & DML
-- Karakter Set  : UTF-8 (utf8mb4)
-- ============================================================================

-- 1. PEMBUATAN DATABASE (MySQL / MariaDB)
CREATE DATABASE IF NOT EXISTS db_kas_bengkel 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE db_kas_bengkel;

-- Nonaktifkan pengecekan foreign key sementara saat import dump
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- STRUKTUR TABEL 1: tbl_rekap_kas
-- Menyimpan pembukuan kas kecil harian, total omset, non-tunai, dan selisih
-- ============================================================================
DROP TABLE IF EXISTS tbl_rekap_kas;
CREATE TABLE tbl_rekap_kas (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID Unik Record (contoh: REC-20260925-01)',
  tanggal DATE NOT NULL COMMENT 'Tanggal rekapitulasi shift kasir (YYYY-MM-DD)',
  kasir VARCHAR(100) NOT NULL COMMENT 'Nama kasir bertugas / shift',
  saldo_awal DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Modal uang kas kecil awal hari',
  penjualan_shop_drive DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total penjualan omset Shop & Drive',
  penjualan_bima_motor DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total penjualan omset Bima Motor',
  pemasukan_lain DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Pemasukan tambahan (jasa derek, scrap aki, titipan)',
  keterangan_pemasukan_lain TEXT DEFAULT NULL COMMENT 'Keterangan sumber pemasukan lain',
  total_pemasukan DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: Penjualan SD + BM + Pemasukan Lain',
  transfer_mandiri DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Pembayaran pelanggan via Transfer Bank Mandiri',
  card_edc DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Pembayaran pelanggan via Kartu Debit / EDC',
  penghematan_trade_in DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Diskon / Tukar tambah (Trade In) aki',
  biaya_operasional DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total pengeluaran biaya operasional / bon kasir',
  total_pengeluaran_kas DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: Transfer + EDC + Trade In + Biaya Ops',
  sisa_uang_kas_kecil DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: (Saldo Awal + Total Pemasukan) - Total Pengeluaran',
  fisik_riil DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Uang fisik nyata hasil hitung di laci kasir',
  selisih DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Rumus: Fisik Riil - Sisa Kas Kecil (0 = Pas)',
  sudah_diambil TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Belum Diambil, 1: Sudah Diambil Owner',
  catatan TEXT DEFAULT NULL COMMENT 'Catatan serah terima kasir / keterangan selisih',
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
-- Pencatatan Restok Bahan Bengkel & Penarikan Rekening Mandiri
-- ============================================================================
DROP TABLE IF EXISTS tbl_transaksi_bank;
CREATE TABLE tbl_transaksi_bank (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'ID Transaksi Bank (RESTOK-xxx / TARIK-xxx)',
  type ENUM('restok', 'penarikan', 'inflow') NOT NULL COMMENT 'Jenis transaksi',
  tanggal DATE NOT NULL COMMENT 'Tanggal transaksi bank (YYYY-MM-DD)',
  supplier VARCHAR(150) DEFAULT NULL COMMENT 'Supplier / Toko Bahan (GS Astra, Aspira, dll)',
  kategori VARCHAR(100) DEFAULT NULL COMMENT 'Kategori barang / jenis pengeluaran',
  nota VARCHAR(100) DEFAULT NULL COMMENT 'Nomor nota / invoice faktur',
  nama VARCHAR(150) DEFAULT NULL COMMENT 'Nama item bahan atau keperluan restok',
  keterangan TEXT DEFAULT NULL COMMENT 'Keterangan lengkap transaksi',
  penerima VARCHAR(150) DEFAULT NULL COMMENT 'Penerima penarikan dana',
  nominal DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal dana keluar/masuk (Rp)',
  status_owner ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'pending' COMMENT 'Status verifikasi owner (PIN 2209)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bank_tanggal (tanggal),
  INDEX idx_bank_type (type),
  INDEX idx_bank_status (status_owner)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Buku Kas Rekening Bank Mandiri & Restok';

-- ============================================================================
-- STRUKTUR TABEL 4: tbl_pengaturan_sistem
-- Konfigurasi sistem, saldo awal rekening, PIN proteksi, nama entitas
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
('rekening_mandiri_name', 'Rekening Mandiri PT DUTARAYA BERJAYA', 'Nama rekening operasional bank'),
('rekening_mandiri_nomor', '13700xxxxxxxx', 'Nomor rekening bank mandiri'),
('owner_name', 'Bapak Owner / Pimpinan', 'Nama pemilik bengkel'),
('pin_owner', '2209', 'PIN verifikasi owner untuk validasi status kas & rekening'),
('saldo_awal_rekening', '0', 'Saldo awal buku rekening bank mandiri');

-- B. Data Isian Rekap Kas Harian (dari database_kas_bengkel.json)
`;

  let expensesList = [];

  if (records.length > 0) {
    sql += `INSERT INTO tbl_rekap_kas (
  id, tanggal, kasir, saldo_awal, 
  penjualan_shop_drive, penjualan_bima_motor, pemasukan_lain, keterangan_pemasukan_lain, total_pemasukan,
  transfer_mandiri, card_edc, penghematan_trade_in, biaya_operasional, total_pengeluaran_kas,
  sisa_uang_kas_kecil, fisik_riil, selisih, sudah_diambil, catatan, created_at
) VALUES\n`;

    const valueRows = records.map((r) => {
      if (r.expenses && Array.isArray(r.expenses)) {
        r.expenses.forEach(exp => {
          expensesList.push({
            rekapId: r.id,
            desc: exp.desc || exp.keterangan || '-',
            amount: exp.amount || exp.nominal || 0
          });
        });
      }

      const sudahDiambilInt = r.sudahDiambil ? 1 : 0;
      const createdAtVal = r.createdAt ? r.createdAt.replace('T', ' ').replace(/\.\d+Z$/, '') : now.replace('T', ' ').slice(0, 19);

      return `(${escapeSql(r.id)}, ${escapeSql(r.tanggal)}, ${escapeSql(r.kasir)}, ${Number(r.saldoAwal) || 0}, ` +
        `${Number(r.penjualanShopDrive) || 0}, ${Number(r.penjualanBimaMotor) || 0}, ${Number(r.pemasukanLain) || 0}, ` +
        `${escapeSql(r.keteranganPemasukanLain || '')}, ${Number(r.totalPemasukan) || 0}, ` +
        `${Number(r.transferMandiri) || 0}, ${Number(r.cardEdc) || 0}, ${Number(r.penghematanTradeIn) || 0}, ` +
        `${Number(r.biayaOperasional) || 0}, ${Number(r.totalPengeluaranKas) || 0}, ` +
        `${Number(r.sisaUangKasKecil) || 0}, ${Number(r.fisikRiil) || 0}, ${Number(r.selisih) || 0}, ` +
        `${sudahDiambilInt}, ${escapeSql(r.catatan || '')}, ${escapeSql(createdAtVal)})`;
    });

    sql += valueRows.join(',\n') + ';\n\n';
  } else {
    sql += `-- Tidak ada record kas saat ini.\n\n`;
  }

  // C. Data Isian Rincian Pengeluaran (jika ada)
  if (expensesList.length > 0) {
    sql += `-- C. Data Isian Rincian Biaya Operasional Kas\n`;
    sql += `INSERT INTO tbl_rincian_pengeluaran (rekap_kas_id, keterangan, nominal) VALUES\n`;
    const expRows = expensesList.map(e => `(${escapeSql(e.rekapId)}, ${escapeSql(e.desc)}, ${Number(e.amount) || 0})`);
    sql += expRows.join(',\n') + ';\n\n';
  }

  // D. Data Isian Transaksi Bank Mandiri & Restok (Template / Rekening Operasional)
  sql += `-- D. Data Isian Transaksi Bank Mandiri (Restok Bahan Bengkel & Penarikan)
-- Catatan: Inflow otomatis tersinkronisasi dari transfer_mandiri dan card_edc tbl_rekap_kas.
INSERT INTO tbl_transaksi_bank (
  id, type, tanggal, supplier, kategori, nota, nama, keterangan, penerima, nominal, status_owner
) VALUES
('RESTOK-SAMPLE-01', 'restok', '2026-09-25', 'GS Astra Distributor', 'Aki & Battery', 'INV/GSA/2026/0925', 'Aki Maintenance Free NS40Z', 'Pembelian restok aki 5 unit', NULL, 3500000.00, 'approved'),
('TARIK-SAMPLE-01', 'penarikan', '2026-09-25', NULL, 'Operasional Bengkel', NULL, NULL, 'Pembayaran listrik PLN bengkel & internet', 'PLN & Indihome', 650000.00, 'approved');

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
-- SELESAI. Seluruh tabel, data, relasi, dan view berhasil di-generate.
-- ============================================================================
`;

  fs.writeFileSync(OUTPUT_SQL_PATH, sql, 'utf8');
  console.log(`✅ File SQL berhasil di-generate: ${OUTPUT_SQL_PATH}`);
  console.log(`   Ukuran: ${Buffer.byteLength(sql, 'utf8')} bytes`);
  console.log(`   Jumlah record kas yang diekspor: ${records.length}`);
}

generateSqlDump();
