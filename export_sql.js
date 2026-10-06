/**
 * SCRIPT EXPORT DATA SISTEM KAS BENGKEL KE FORMAT SQL
 * Mengonversi seluruh data riil dari database_kas_bengkel.json (35 record kas,
 * transaksi bank mandiri, rincian biaya operasional, dan pengaturan)
 * ke database_kas_bengkel.sql
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
  const bankTxs = jsonData.bankTransactions || [];
  const bankSettings = jsonData.bankSettings || {
    accountName: 'Bank Mandiri - 1560023250204',
    ownerName: 'PT DUTARAYA BERJAYA',
    saldoAwal: 0,
    saldoBulanLalu: 29384422
  };
  const appSettings = jsonData.appSettings || {
    bengkelName: 'Shop & Drive & Bima Motor',
    defaultKasir: 'Adis Setiawan',
    pinOwner: '2209'
  };

  const now = new Date().toISOString();

  let sql = `-- ============================================================================
-- DATABASE DUMP & SKEMA RELASIONAL: MONITOR KAS KECIL BENGKEL
-- Entitas Bisnis: Shop & Drive & Bima Motor / PT DUTARAYA BERJAYA
-- Tanggal Ekspor : ${now}
-- Format Data    : MySQL / MariaDB / PostgreSQL / SQLite Compatible DDL & DML
-- Karakter Set   : UTF-8 (utf8mb4)
-- Total Record   : ${records.length} Catatan Kas Harian | ${bankTxs.length} Transaksi Rekening Mandiri
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
('bengkel_name', ${escapeSql(appSettings.bengkelName || 'Shop & Drive & Bima Motor')}, 'Nama bengkel / unit bisnis'),
('default_kasir', ${escapeSql(appSettings.defaultKasir || 'Adis Setiawan')}, 'Kasir default'),
('rekening_mandiri_name', ${escapeSql(bankSettings.accountName || 'Bank Mandiri - 1560023250204')}, 'Nama rekening operasional bank'),
('owner_name', ${escapeSql(bankSettings.ownerName || 'PT DUTARAYA BERJAYA')}, 'Nama pemilik bengkel / perusahaan'),
('pin_owner', ${escapeSql(appSettings.pinOwner || '2209')}, 'PIN verifikasi owner untuk validasi status kas & rekening'),
('saldo_awal_rekening', ${escapeSql(bankSettings.saldoAwal || 0)}, 'Saldo awal buku rekening bank mandiri'),
('saldo_bulan_lalu', ${escapeSql(bankSettings.saldoBulanLalu || 29384422)}, 'Saldo buku rekening bulan lalu');

-- B. Data Isian Rekap Kas Harian (Total: ${records.length} Records)
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
          if (exp.desc || exp.amount) {
            expensesList.push({
              rekapId: r.id,
              desc: exp.desc || exp.keterangan || 'Operasional',
              amount: exp.amount || exp.nominal || 0
            });
          }
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
  }

  // C. Data Isian Rincian Pengeluaran Operasional
  if (expensesList.length > 0) {
    sql += `-- C. Data Isian Rincian Biaya Operasional Kas (Total: ${expensesList.length} Rincian Bon)\n`;
    sql += `INSERT INTO tbl_rincian_pengeluaran (rekap_kas_id, keterangan, nominal) VALUES\n`;
    const expRows = expensesList.map(e => `(${escapeSql(e.rekapId)}, ${escapeSql(e.desc)}, ${Number(e.amount) || 0})`);
    sql += expRows.join(',\n') + ';\n\n';
  }

  // D. Data Isian Transaksi Bank Mandiri & Restok
  if (bankTxs.length > 0) {
    sql += `-- D. Data Isian Transaksi Bank Mandiri (Total: ${bankTxs.length} Transaksi Riil Restok & Penarikan)\n`;
    sql += `INSERT INTO tbl_transaksi_bank (
  id, type, tanggal, supplier, kategori, nota, nama, keterangan, penerima, nominal, status_owner, created_at
) VALUES\n`;
    const txRows = bankTxs.map(t => {
      const cDate = t.createdAt ? t.createdAt.replace('T', ' ').replace(/\.\d+Z$/, '') : now.replace('T', ' ').slice(0, 19);
      return `(${escapeSql(t.id)}, ${escapeSql(t.type)}, ${escapeSql(t.tanggal)}, ${escapeSql(t.supplier)}, ` +
        `${escapeSql(t.kategori)}, ${escapeSql(t.nota)}, ${escapeSql(t.nama)}, ${escapeSql(t.keterangan)}, ` +
        `${escapeSql(t.penerima)}, ${Number(t.nominal) || 0}, ${escapeSql(t.statusOwner || 'approved')}, ${escapeSql(cDate)})`;
    });
    sql += txRows.join(',\n') + ';\n\n';
  }

  // E. Views
  sql += `-- ============================================================================
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
`;

  fs.writeFileSync(OUTPUT_SQL_PATH, sql, 'utf8');
  console.log(`✅ File SQL berhasil di-generate: ${OUTPUT_SQL_PATH}`);
  console.log(`   Ukuran: ${Buffer.byteLength(sql, 'utf8')} bytes`);
  console.log(`   Record kas diekspor: ${records.length}`);
  console.log(`   Rincian bon operasional: ${expensesList.length}`);
  console.log(`   Transaksi rekening Mandiri diekspor: ${bankTxs.length}`);
}

generateSqlDump();
