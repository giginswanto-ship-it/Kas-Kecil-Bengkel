/**
 * ============================================================================
 * PROGRAM PEMBACA RIWAYAT PENCATATAN KAS BENGKEL
 * (Shop & Drive & Bima Motor)
 * ============================================================================
 * Program berbasis CLI interaktif untuk membaca, memfilter, mencari,
 * menganalisis, dan melihat rincian riwayat kas bengkel dari file JSON / CSV.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DEFAULT_DB_PATH = path.join(__dirname, 'database_kas_bengkel.json');
const DEFAULT_CSV_PATH = path.join(__dirname, 'Template_Kas_Shop_And_Drive.csv');

// Format Rupiah
function formatRupiah(val) {
  const num = Number(val) || 0;
  return 'Rp ' + Math.floor(num).toLocaleString('id-ID');
}

// Pad helper untuk tabel terminal
function pad(str, len, align = 'left') {
  str = String(str || '');
  if (str.length > len) {
    return str.substring(0, len - 3) + '...';
  }
  if (align === 'right') {
    return str.padStart(len, ' ');
  }
  return str.padEnd(len, ' ');
}

// Baca data dari file JSON
function loadJsonRecords(filePath = DEFAULT_DB_PATH) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.records)) return parsed.records;
    return [];
  } catch (err) {
    console.error(`❌ Gagal membaca file JSON (${filePath}):`, err.message);
    return [];
  }
}

// Baca data dari file CSV
function loadCsvRecords(filePath = DEFAULT_CSV_PATH) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(';').map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';').map(c => c.trim());
      if (cols.length < 2 || !cols[0]) continue;

      records.push({
        tanggal: cols[0] || '',
        kasir: cols[1] || '-',
        saldoAwal: Number(cols[2]) || 0,
        penjualanShopDrive: Number(cols[3]) || 0,
        penjualanBimaMotor: Number(cols[4]) || 0,
        totalPemasukan: Number(cols[5]) || 0,
        transferMandiri: Number(cols[6]) || 0,
        cardEdc: Number(cols[7]) || 0,
        penghematanTradeIn: Number(cols[8]) || 0,
        biayaOperasional: Number(cols[9]) || 0,
        totalPengeluaranKas: Number(cols[10]) || 0,
        sisaUangKasKecil: Number(cols[11]) || 0,
        fisikRiil: Number(cols[12]) || 0,
        selisih: Number(cols[13]) || 0,
        catatan: cols[14] || '',
        expenses: []
      });
    }
    return records;
  } catch (err) {
    console.error(`❌ Gagal membaca file CSV (${filePath}):`, err.message);
    return [];
  }
}

// Ambil semua records (utamakan JSON, fallback CSV)
function getAllRecords() {
  const jsonRecords = loadJsonRecords();
  if (jsonRecords.length > 0) return jsonRecords;

  const csvRecords = loadCsvRecords();
  return csvRecords;
}

// Buat garis horizontal
function printLine(char = '=', length = 115) {
  console.log(char.repeat(length));
}

// Tampilkan Tabel Riwayat
function displayRecordsTable(records, title = 'DAFTAR RIWAYAT PENCATATAN KAS BENGKEL') {
  console.clear();
  printLine('=');
  console.log(`  📊 ${title}`);
  printLine('=');

  if (!records || records.length === 0) {
    console.log('\n  ⚠️  Tidak ada data riwayat kas yang ditemukan.\n');
    printLine('-');
    return;
  }

  // Header
  console.log(
    ` ${pad('No', 3, 'right')} | ${pad('Tanggal', 10)} | ${pad('Kasir / Shift', 14)} | ${pad('Omset S&D', 13, 'right')} | ${pad('Omset Bima', 13, 'right')} | ${pad('Total Masuk', 14, 'right')} | ${pad('Sisa Kas', 13, 'right')} | ${pad('Selisih', 10, 'right')} | ${pad('Pengambilan Kas', 16)}`
  );
  printLine('-');

  let totalSD = 0;
  let totalBima = 0;
  let totalMasuk = 0;
  let totalSisaKas = 0;
  let totalFisik = 0;
  let totalSelisih = 0;
  let takenCount = 0;

  records.forEach((r, idx) => {
    const sd = Number(r.penjualanShopDrive || 0);
    const bima = Number(r.penjualanBimaMotor || 0);
    const masuk = Number(r.totalPemasukan || 0);
    const sisa = Number(r.sisaUangKasKecil || 0);
    const fisik = Number(r.fisikRiil || 0);
    const selisih = Number(r.selisih || 0);
    const isTaken = r.sudahDiambil === true;

    totalSD += sd;
    totalBima += bima;
    totalMasuk += masuk;
    totalSisaKas += sisa;
    totalFisik += fisik;
    totalSelisih += selisih;
    if (isTaken) takenCount++;

    const statusAmbil = isTaken ? '[√] SUDAH DIAMBIL' : '[ ] BELUM DIAMBIL';

    console.log(
      ` ${pad(idx + 1, 3, 'right')} | ${pad(r.tanggal || '-', 10)} | ${pad(r.kasir || '-', 14)} | ${pad(formatRupiah(sd), 13, 'right')} | ${pad(formatRupiah(bima), 13, 'right')} | ${pad(formatRupiah(masuk), 14, 'right')} | ${pad(formatRupiah(sisa), 13, 'right')} | ${pad(formatRupiah(selisih), 10, 'right')} | ${pad(statusAmbil, 16)}`
    );
  });

  printLine('-');
  // Summary row
  console.log(
    ` ${pad('TOTAL', 30, 'right')} | ${pad(formatRupiah(totalSD), 13, 'right')} | ${pad(formatRupiah(totalBima), 13, 'right')} | ${pad(formatRupiah(totalMasuk), 14, 'right')} | ${pad(formatRupiah(totalSisaKas), 13, 'right')} | ${pad(formatRupiah(totalSelisih), 10, 'right')} | ${pad(`${takenCount}/${records.length} Diambil`, 16)}`
  );
  printLine('=');
  console.log(`  Total Data: ${records.length} transaksi kas | Sudah Diambil: ${takenCount} | Belum: ${records.length - takenCount}`);
  printLine('=');
}

// Tampilkan Detail Lengkap Satu Record
function displayRecordDetail(record) {
  console.clear();
  printLine('=');
  console.log(`  🧾 RINCIAN BERITA ACARA KAS - TANGGAL ${record.tanggal || '-'}`);
  printLine('=');

  const isTaken = record.sudahDiambil === true;
  console.log(`  • ID Record             : ${record.id || '-'}`);
  console.log(`  • Tanggal Transaksi     : ${record.tanggal || '-'}`);
  console.log(`  • Kasir / Shift         : ${record.kasir || '-'}`);
  console.log(`  • Status Pengambilan    : ${isTaken ? '✅ [√] SUDAH DIAMBIL' : '⏳ [ ] BELUM DIAMBIL'}`);
  console.log(`  • Waktu Simpan          : ${record.createdAt ? new Date(record.createdAt).toLocaleString('id-ID') : '-'}`);
  console.log(`  • Catatan Operasional   : ${record.catatan || '(Tidak ada)'}`);
  printLine('-');

  console.log('  💵 PEMASUKAN & MODAL:');
  console.log(`    - Saldo Awal Modal Kas : ${formatRupiah(record.saldoAwal)}`);
  console.log(`    - Penjualan Shop & Drive: ${formatRupiah(record.penjualanShopDrive)}`);
  console.log(`    - Penjualan Bima Motor  : ${formatRupiah(record.penjualanBimaMotor)}`);
  console.log(`    ─────────────────────────────────────────────────`);
  console.log(`    👉 TOTAL PEMASUKAN      : ${formatRupiah(record.totalPemasukan)}`);
  console.log(`    👉 TOTAL KAS TERSEDIA   : ${formatRupiah(Number(record.saldoAwal || 0) + Number(record.totalPemasukan || 0))}`);
  printLine('-');

  console.log('  💳 PENGELUARAN NON-TUNAI & BIAYA OPERASIONAL:');
  console.log(`    - Transfer Bank Mandiri : ${formatRupiah(record.transferMandiri)}`);
  console.log(`    - Pembayaran Card / EDC : ${formatRupiah(record.cardEdc)}`);
  console.log(`    - Trade In / Penghematan: ${formatRupiah(record.penghematanTradeIn)}`);
  console.log(`    - Pengeluaran Biaya Ops : ${formatRupiah(record.biayaOperasional)}`);
  console.log(`    ─────────────────────────────────────────────────`);
  console.log(`    👉 TOTAL PENGELUARAN KAS: ${formatRupiah(record.totalPengeluaranKas)}`);
  printLine('-');

  console.log('  ⚖️ REKONSILIASI AKHIR & VALIDASI FISIK:');
  console.log(`    - Sisa Seharusnya Kas   : ${formatRupiah(record.sisaUangKasKecil)}`);
  console.log(`    - Uang Fisik Riil Laci  : ${formatRupiah(record.fisikRiil)}`);
  
  const selisih = Number(record.selisih || 0);
  let statusText = '🟢 PAS (Sesuai)';
  if (selisih > 0) statusText = `🔵 LEBIH (Surplus ${formatRupiah(selisih)})`;
  if (selisih < 0) statusText = `🔴 KURANG (Defisit ${formatRupiah(Math.abs(selisih))})`;

  console.log(`    - Selisih Kasir         : ${formatRupiah(selisih)}`);
  console.log(`    - Status Validasi       : ${statusText}`);
  printLine('-');

  if (record.expenses && record.expenses.length > 0) {
    console.log('  📝 RINCIAN BON BIAYA OPERASIONAL:');
    record.expenses.forEach((exp, i) => {
      console.log(`    ${i + 1}. ${pad(exp.nama || exp.desc || 'Biaya', 30)} : ${formatRupiah(exp.nominal || exp.amount)}`);
    });
    printLine('-');
  }

  printLine('=');
}

// Rekapitulasi Statistik Keuangan Keseluruhan
function displaySummaryStats(records) {
  console.clear();
  printLine('=');
  console.log('  📈 REKAPITULASI & STATISTIK KEUANGAN KAS BENGKEL');
  printLine('=');

  if (!records || records.length === 0) {
    console.log('\n  ⚠️  Belum ada data untuk dianalisis.\n');
    printLine('-');
    return;
  }

  let totalSaldoAwal = 0;
  let totalSD = 0;
  let totalBima = 0;
  let totalMasuk = 0;
  let totalMandiri = 0;
  let totalCard = 0;
  let totalTradeIn = 0;
  let totalOps = 0;
  let totalKeluar = 0;
  let totalSisa = 0;
  let totalFisik = 0;
  let totalSelisih = 0;
  let pasCount = 0;
  let lebihCount = 0;
  let kurangCount = 0;

  records.forEach(r => {
    totalSaldoAwal += Number(r.saldoAwal || 0);
    totalSD += Number(r.penjualanShopDrive || 0);
    totalBima += Number(r.penjualanBimaMotor || 0);
    totalMasuk += Number(r.totalPemasukan || 0);
    totalMandiri += Number(r.transferMandiri || 0);
    totalCard += Number(r.cardEdc || 0);
    totalTradeIn += Number(r.penghematanTradeIn || 0);
    totalOps += Number(r.biayaOperasional || 0);
    totalKeluar += Number(r.totalPengeluaranKas || 0);
    totalSisa += Number(r.sisaUangKasKecil || 0);
    totalFisik += Number(r.fisikRiil || 0);

    const sel = Number(r.selisih || 0);
    totalSelisih += sel;
    if (sel === 0) pasCount++;
    else if (sel > 0) lebihCount++;
    else kurangCount++;
  });

  const avgHarian = records.length > 0 ? Math.round(totalMasuk / records.length) : 0;
  const persenSD = totalMasuk > 0 ? ((totalSD / totalMasuk) * 100).toFixed(1) : 0;
  const persenBima = totalMasuk > 0 ? ((totalBima / totalMasuk) * 100).toFixed(1) : 0;

  console.log(`  📌 Total Hari / Catatan       : ${records.length} Hari`);
  console.log(`  📌 Rata-rata Omset Harian     : ${formatRupiah(avgHarian)} / hari\n`);

  console.log('  💰 TOTAL OMSET PENJUALAN:');
  console.log(`    - Shop & Drive              : ${formatRupiah(totalSD)} (${persenSD}%)`);
  console.log(`    - Bima Motor                : ${formatRupiah(totalBima)} (${persenBima}%)`);
  console.log(`    ───────────────────────────────────────────────────────`);
  console.log(`    👉 TOTAL PEMASUKAN KOTOR    : ${formatRupiah(totalMasuk)}`);
  printLine('-');

  console.log('  💸 TOTAL POTONGAN & PENGELUARAN KAS:');
  console.log(`    - Transfer Bank Mandiri     : ${formatRupiah(totalMandiri)}`);
  console.log(`    - Pembayaran Card / EDC     : ${formatRupiah(totalCard)}`);
  console.log(`    - Trade In / Penghematan    : ${formatRupiah(totalTradeIn)}`);
  console.log(`    - Biaya Operasional Bengkel : ${formatRupiah(totalOps)}`);
  console.log(`    ───────────────────────────────────────────────────────`);
  console.log(`    👉 TOTAL PENGELUARAN KAS    : ${formatRupiah(totalKeluar)}`);
  printLine('-');

  console.log('  ⚖️ REKAPITULASI FISIK & KINERJA KASIR:');
  console.log(`    - Total Sisa Kas Teori      : ${formatRupiah(totalSisa)}`);
  console.log(`    - Total Uang Fisik Riil     : ${formatRupiah(totalFisik)}`);
  console.log(`    - Total Akumulasi Selisih   : ${formatRupiah(totalSelisih)}`);
  console.log(`    - Rekap Hari Validasi       : ${pasCount} Hari Pas, ${lebihCount} Hari Surplus, ${kurangCount} Hari Defisit`);
  printLine('=');
}

// Menu Navigasi CLI
function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (query) => new Promise(resolve => rl.question(query, resolve));

  async function loop() {
    while (true) {
      console.clear();
      printLine('=');
      console.log('  🚗💨 SISTEM PEMBACA RIWAYAT KAS BENGKEL (Shop & Drive & Bima Motor)');
      printLine('=');
      console.log(`  File Database Aktif: ${DEFAULT_DB_PATH}`);
      printLine('-');
      console.log('  [1] 📋 Tampilkan Seluruh Riwayat Kas');
      console.log('  [2] 📅 Filter Riwayat Berdasarkan Tanggal / Bulan');
      console.log('  [3] 👤 Cari Berdasarkan Nama Kasir / Kata Kunci');
      console.log('  [4] 🔍 Lihat Rincian Detail Lengkap per Record');
      console.log('  [5] 📊 Rekapitulasi & Statistik Keuangan Total');
      console.log('  [6] 📁 Buka File Database Custom (JSON / CSV)');
      console.log('  [0] 🚪 Keluar dari Program');
      printLine('-');

      const choice = (await ask('  👉 Pilih Menu (0-6): ')).trim();

      if (choice === '0') {
        console.log('\n  Terima kasih telah menggunakan Sistem Pembaca Kas Bengkel. Sampai jumpa!\n');
        rl.close();
        process.exit(0);
      }

      const records = getAllRecords();

      if (choice === '1') {
        displayRecordsTable(records, 'SEMUA RIWAYAT PENCATATAN KAS');
        await ask('\n  [Tekan ENTER untuk kembali ke menu utama]');
      } else if (choice === '2') {
        const keyword = (await ask('\n  Masukkan Tanggal atau Bulan (contoh: 2026-09 atau 2026-09-17): ')).trim();
        if (keyword) {
          const filtered = records.filter(r => (r.tanggal || '').includes(keyword));
          displayRecordsTable(filtered, `HASIL FILTER TANGGAL: "${keyword}"`);
        }
        await ask('\n  [Tekan ENTER untuk kembali ke menu utama]');
      } else if (choice === '3') {
        const keyword = (await ask('\n  Masukkan Nama Kasir atau Kata Kunci Catatan: ')).trim().toLowerCase();
        if (keyword) {
          const filtered = records.filter(r => 
            (r.kasir || '').toLowerCase().includes(keyword) || 
            (r.catatan || '').toLowerCase().includes(keyword)
          );
          displayRecordsTable(filtered, `HASIL PENCARIAN KATA KUNCI: "${keyword}"`);
        }
        await ask('\n  [Tekan ENTER untuk kembali ke menu utama]');
      } else if (choice === '4') {
        if (records.length === 0) {
          console.log('\n  ⚠️  Belum ada data riwayat kas.');
          await ask('\n  [Tekan ENTER untuk kembali]');
          continue;
        }

        displayRecordsTable(records, 'PILIH NOMOR RECORD UNTUK MELIHAT RINCIAN');
        const numStr = (await ask(`\n  Masukkan Nomor Baris (1 - ${records.length}): `)).trim();
        const num = parseInt(numStr, 10);

        if (num >= 1 && num <= records.length) {
          displayRecordDetail(records[num - 1]);
        } else {
          console.log('\n  ❌ Nomor tidak valid!');
        }
        await ask('\n  [Tekan ENTER untuk kembali ke menu utama]');
      } else if (choice === '5') {
        displaySummaryStats(records);
        await ask('\n  [Tekan ENTER untuk kembali ke menu utama]');
      } else if (choice === '6') {
        const customPath = (await ask('\n  Masukkan path file (.json atau .csv): ')).trim();
        if (customPath && fs.existsSync(customPath)) {
          let customRecords = [];
          if (customPath.toLowerCase().endsWith('.csv')) {
            customRecords = loadCsvRecords(customPath);
          } else {
            customRecords = loadJsonRecords(customPath);
          }
          displayRecordsTable(customRecords, `DATA DARI FILE: ${path.basename(customPath)}`);
        } else {
          console.log('\n  ❌ File tidak ditemukan atau path salah.');
        }
        await ask('\n  [Tekan ENTER untuk kembali ke menu utama]');
      }
    }
  }

  loop();
}

// Jalankan program jika dieksekusi langsung
if (require.main === module) {
  main();
}

module.exports = {
  loadJsonRecords,
  loadCsvRecords,
  getAllRecords,
  displayRecordsTable,
  displayRecordDetail,
  displaySummaryStats
};
