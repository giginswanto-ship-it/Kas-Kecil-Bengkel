const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync('database_kas_bengkel.json', 'utf8'));
const txs = db.bankTransactions || [];
const records = db.records || [];
const settings = db.bankSettings || {
  accountName: 'Bank Mandiri - 1560023250204',
  ownerName: 'PT DUTARAYA BERJAYA',
  saldoAwal: 29384422
};

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

let sql = `-- ============================================================================
-- SQL DUMP KHUSUS: REKENING BANK MANDIRI & RESTOK BAHAN
-- PT DUTARAYA BERJAYA - SHOP & DRIVE & BIMA MOTOR
-- No. Rekening   : 1560023250204
-- Tanggal Ekspor : ${new Date().toISOString()}
-- Total Transaksi: ${txs.length} Transaksi Outflow/Restok | ${records.length} Hari Inflow Kasir
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
VALUES (${esc(settings.accountName)}, ${esc(settings.ownerName)}, 'Shop & Drive & Bima Motor', ${settings.saldoAwal || 29384422}, ${settings.saldoBulanLalu || 29384422});

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
`;

const txValues = txs.map(t => {
  const dt = t.createdAt ? t.createdAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().slice(0, 19);
  return `(${esc(t.id)}, ${esc(t.type)}, ${esc(t.tanggal)}, ${esc(t.supplier)}, ${esc(t.kategori)}, ${esc(t.nota)}, ${esc(t.nama)}, ${esc(t.keterangan)}, ${esc(t.penerima)}, ${t.nominal || 0}, ${esc(t.statusOwner || 'approved')}, ${esc(dt)})`;
});

sql += txValues.join(',\n') + ';\n\n';

sql += `-- ----------------------------------------------------------------------------
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
`;

const inflowValues = records.map(r => {
  const tm = Number(r.transferMandiri) || 0;
  const edc = Number(r.cardEdc) || 0;
  const total = tm + edc;
  const dt = r.createdAt ? r.createdAt.replace('T', ' ').slice(0, 19) : new Date().toISOString().slice(0, 19);
  return `(${esc(r.id)}, ${esc(r.tanggal)}, ${esc(r.kasir)}, ${tm}, ${edc}, ${total}, ${esc(dt)})`;
});

sql += inflowValues.join(',\n') + ';\n\n';

sql += `-- ----------------------------------------------------------------------------
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
`;

fs.writeFileSync('rekening_bank_mandiri.sql', sql, 'utf8');
console.log('rekening_bank_mandiri.sql successfully generated!');
