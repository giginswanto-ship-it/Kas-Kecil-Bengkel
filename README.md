# MONITOR KAS KECIL BENGKEL (Shop & Drive & Bima Motor)

Aplikasi Web modern & responsif untuk sistem pencatatan, kalkulasi otomatis, dan monitoring uang tunai (kas kecil) serta transaksi non-tunai di bengkel **Shop & Drive** dan **Bima Motor**.

---

## 🧮 Rumus Baku & Logika Keuangan

1. **Total Pemasukan** = Penjualan Shop & Drive + Penjualan Bima Motor
2. **Total Pengeluaran Kas** = Transfer Bank Mandiri + Pembayaran Card/EDC + Penghematan/Trade In + Pengeluaran Biaya Operasional
3. **Sisa Uang di Kas Kecil** = (Saldo Awal + Total Pemasukan) - Total Pengeluaran Kas
4. **Selisih Kasir** = Uang Fisik Riil di Laci - Sisa Uang di Kas Kecil

---

## ✨ Fitur-Fitur Utama

- **Sistem Database Terintegrasi**: Menggunakan engine database **IndexedDB** & **LocalStorage** dengan dukungan backup/restore file JSON dan SQL Dump.
- **Kalender Harian Interaktif**: Memilih dan melihat status rekapitulasi kas harian per tanggal secara visual (titik hijau penanda tanggal yang telah memiliki data rekap).
- **Pemisahan Sumber Pemasukan**: Mencatat omset terpisah antara Shop & Drive dan Bima Motor secara otomatis.
- **Auto-Kalkulasi Realtime**: Perhitungan langsung berjalan seketika saat kasir mengetik nominal.
- **Rincian Pengeluaran Operasional Dinamis**: Kasir dapat menambah/menghapus baris bon pengeluaran kas kecil (bensin, makan siang, sparepart darurat, dll).
- **Kalkulator Pecahan Uang Fisik (Denomination Counter)**: Mempermudah kasir menghitung lembaran (Rp 100rb, 50rb, 20rb, 10rb, 5rb, 2rb, 1rb) dan uang koin saat tutup shift / serah terima kasir.
- **Uji Petik & Validasi Selisih**: Otomatis mendeteksi status **Pas (Sesuai)**, **Lebih (Surplus)**, atau **Kurang (Defisit)**.
- **Ekspor Excel (CSV)**: Unduh rekap pembukuan kas yang rapi dan kompatibel dengan Microsoft Excel & Google Sheets.
- **Cetak Berita Acara Kas Resmi**: Format cetak siap pakai dengan tabel rekap kas dan kolom tanda tangan Kasir & Kepala Bengkel.

---

## 💾 Manajemen Database

1. **Pusat Database di Browser**:
   - Klik tombol **Database** di header aplikasi untuk melihat statistik database, melakukan **Cadangkan (.json / .sql)** atau **Pulihkan (Restore)** data.
2. **Server Backend Database (Opsional)**:
   - Klik ganda file \`start-server.bat\` (atau jalankan \`node server.js\`) untuk mengaktifkan REST API database server lokal di port 3000 (\`http://localhost:3000\`).

---

## 🚀 Cara Penggunaan

1. Buka file \`index.html\` langsung di web browser (Google Chrome, Microsoft Edge, Mozilla Firefox).
2. Masukkan tanggal, shift, dan saldo awal modal kasir.
3. Input nominal Penjualan Shop & Drive dan Bima Motor.
4. Input potongan non-tunai (Transfer Mandiri, EDC Card, Penghematan/Trade In) dan rincian biaya operasional.
5. Hitung fisik uang di laci menggunakan kalkulator pecahan atau input langsung di kolom Uang Fisik Riil.
6. Klik **Simpan ke Database & Riwayat** atau **Cetak Berita Acara Kas**.
