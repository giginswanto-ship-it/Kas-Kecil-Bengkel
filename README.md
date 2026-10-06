# MONITOR KAS KECIL BENGKEL (Shop & Drive & Bima Motor)

Aplikasi Web modern & responsif untuk sistem pencatatan, kalkulasi otomatis, dan monitoring uang tunai (kas kecil) serta transaksi non-tunai di bengkel **Shop & Drive** dan **Bima Motor**.

---

## 🧮 Rumus Baku & Logika Keuangan

1. **Total Pemasukan** = Penjualan Shop & Drive + Penjualan Bima Motor + Sumber Pemasukan Lain
2. **Total Pengeluaran Kas** = Transfer Bank Mandiri + Pembayaran Card/EDC + Penghematan/Trade In + Pengeluaran Biaya Operasional
3. **Sisa Uang di Kas Kecil** = (Saldo Awal + Total Pemasukan) - Total Pengeluaran Kas
4. **Selisih Kasir** = Uang Fisik Riil di Laci - Sisa Uang di Kas Kecil

---

## ✨ Fitur-Fitur Utama

- **Sistem Database Terintegrasi**: Menggunakan engine database **IndexedDB** & **LocalStorage** dengan dukungan backup/restore file JSON dan SQL Dump.
- **Penanggalan Terintegrasi Penuh (2-Arah)**: Sinkronisasi otomatis dan mulus antara form input, kalender harian kas, database, dan tabel riwayat. Memilih tanggal langsung memuat data kas tersimpan atau menyiapkan form baru.
- **Navigasi Cepat Tanggal & Format Indonesia**: Tombol navigasi `◀ Kemarin (H-1)`, `Hari Ini`, dan `Besok (H+1) ▶` langsung di form input, disertai label otomatis format hari & tanggal bahasa Indonesia (*contoh: "Jumat, 25 September 2026"*).
- **Estafet Saldo Kas (Tarik Kas H-1 ke Saldo Awal)**: Tombol cerdas `Tarik Kas H-1` yang mendeteksi sisa kas fisik dari penutupan shift kemarin untuk dijadikan modal awal hari ini.
- **Kalender Harian Interaktif**: Memilih dan melihat status rekapitulasi kas harian per tanggal secara visual (titik hijau penanda tanggal yang telah memiliki data rekap kas dan tooltip detail).
- **Filter Penanggalan Riwayat Kas**: Filter komprehensif pada tabel riwayat untuk menampilkan data berdasarkan *Semua Data*, *Tanggal Aktif Form*, *Bulan Ini*, *Hari Ini*, maupun *Pilih Bulan Spesifik*.
- **Pemisahan Sumber Pemasukan**: Mencatat omset terpisah antara Shop & Drive, Bima Motor, serta Sumber Pemasukan Lain (jasa derek, scrap aki bekas, titipan, dll).
- **Auto-Kalkulasi Realtime**: Perhitungan langsung berjalan seketika saat kasir mengetik nominal.
- **Rincian Pengeluaran Operasional Dinamis**: Kasir dapat menambah/menghapus baris bon pengeluaran kas kecil (bensin, makan siang, sparepart darurat, dll).
- **Kalkulator Pecahan Uang Fisik (Denomination Counter)**: Mempermudah kasir menghitung lembaran (Rp 100rb, 50rb, 20rb, 10rb, 5rb, 2rb, 1rb) dan uang koin saat tutup shift / serah terima kasir.
- **Uji Petik & Validasi Selisih**: Otomatis mendeteksi status **Pas (Sesuai)**, **Lebih (Surplus)**, atau **Kurang (Defisit)**.
- **Unduh Laporan PDF Langsung**: Tombol 1-klik untuk mengunduh dokumen Berita Acara Kas ke format file PDF resolusi tinggi (A4) secara instan.
- **Ekspor Excel (CSV)**: Unduh rekap pembukuan kas yang rapi dan kompatibel dengan Microsoft Excel & Google Sheets.
- **Cetak Berita Acara Kas Resmi**: Format cetak siap pakai dengan tabel rekap kas dan kolom tanda tangan Kasir & Kepala Bengkel.

---

## 💾 Manajemen Database & Format SQL

1. **File Dump SQL Repository (`database_kas_bengkel.sql`)**:
   - Seluruh data kas harian, rincian biaya operasional, transaksi rekening bank Mandiri, serta konfigurasi sistem telah tersedia dalam format SQL standar (`MySQL / MariaDB / PostgreSQL / SQLite`).
   - Struktur skema mencakup:
     - `tbl_rekap_kas`: Pencatatan kas harian, omset tunai/non-tunai, dan status fisik laci.
     - `tbl_rincian_pengeluaran`: Relasi bon pengeluaran operasional per kasir.
     - `tbl_transaksi_bank`: Buku besar rekening Mandiri (restok barang & penarikan).
     - `tbl_pengaturan_sistem`: Konfigurasi nama toko, PIN owner, dan saldo rekening.
     - View laporan: `v_ringkasan_kas_harian`, `v_rekap_bulanan`, dan `v_monitoring_rekening_mandiri`.
   - Untuk memperbarui file SQL sewaktu-waktu dari data terbaru, jalankan:
     ```bash
     npm run export:sql
     # atau
     node export_sql.js
     ```

2. **Pusat Database di Browser**:
   - Klik tombol **Database** di header aplikasi untuk melihat statistik database, melakukan **Cadangkan (.json / .sql)** atau **Pulihkan (Restore)** data.

3. **Server Backend Database (Opsional)**:
   - Klik ganda file `start-server.bat` (atau jalankan `node server.js`) untuk mengaktifkan REST API database server lokal di port 3000 (`http://localhost:3000`).

---

## 🚀 Cara Penggunaan

1. Buka file `index.html` langsung di web browser (Google Chrome, Microsoft Edge, Mozilla Firefox).
2. Masukkan tanggal, shift, dan saldo awal modal kasir.
3. Input nominal Penjualan Shop & Drive, Bima Motor, dan Sumber Pemasukan Lain (beserta keterangannya).
4. Input potongan non-tunai (Transfer Mandiri, EDC Card, Penghematan/Trade In) dan rincian biaya operasional.
5. Hitung fisik uang di laci menggunakan kalkulator pecahan atau input langsung di kolom Uang Fisik Riil.
6. Klik **Simpan ke Database & Riwayat** atau **Cetak Berita Acara Kas**.
