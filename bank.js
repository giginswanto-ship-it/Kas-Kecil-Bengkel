/**
 * MONITORING REKENING BANK MANDIRI & RESTOK BAHAN
 * Logic for Bank Mandiri Ledger, Material Restock (Pembelian Bahan),
 * Non-Cash Kasir Inflow Sync (Transfer Mandiri + Card EDC),
 * Other Withdrawals, Owner Validation, Realtime Balance Estimates,
 * and Export to PDF / Excel CSV.
 */

// BUNDLED EMBEDDED DATABASE (OFFLINE & DIRECT ACCESS GUARANTEED)
var BUNDLED_KAS_DATABASE = {"appName":"Monitor Kas Kecil Bengkel","version":"1.0.0","lastBackup":"2026-10-06T11:50:25.686Z","appSettings":{"defaultKasir":"Adis Setiawan","defaultModal":0,"bengkelName":"Shop & Drive & Bima Motor","pinOwner":"2209"},"bankSettings":{"saldoAwal":29384422,"saldoBulanLalu":29384422,"accountName":"Bank Mandiri - 1560023250204","ownerName":"PT DUTARAYA BERJAYA"},"bankTransactions":[{"id":"TARIK-1791248415217","type":"penarikan","tanggal":"2026-10-02","kategori":"Prive / Bagi Hasil Owner","keterangan":"Prive Mingguan","penerima":"Bp Swanto mandiri","nominal":4500000,"statusOwner":"approved","updatedAt":"2026-10-06T01:00:15.217Z","createdAt":"2026-10-06T01:00:15.217Z"},{"id":"TARIK-1791248372626","type":"penarikan","tanggal":"2026-10-01","kategori":"Gaji & Insentif Karyawan","keterangan":"Insentip Fera Pajak","penerima":"BCA Fera Ferdianti","nominal":1500000,"statusOwner":"approved","updatedAt":"2026-10-06T00:59:32.627Z","createdAt":"2026-10-06T00:59:32.627Z"},{"id":"TARIK-1791248043056","type":"penarikan","tanggal":"2026-09-30","kategori":"Prive / Bagi Hasil Owner","keterangan":"Pembelian PC Untuk Server","penerima":"BCA Ashabil Syauqi Snaprint GW","nominal":7000000,"statusOwner":"approved","updatedAt":"2026-10-06T00:55:35.600Z","createdAt":"2026-10-06T00:54:03.057Z"},{"id":"RESTOK-1791247927128","type":"restok","tanggal":"2026-09-28","supplier":"AOP","kategori":"Aki & Baterai","nota":"","nama":"Barang dagangan Shop And Drive","nominal":31743686,"statusOwner":"approved","updatedAt":"2026-10-06T00:52:07.128Z","createdAt":"2026-10-06T00:52:07.128Z"},{"id":"TARIK-1791247821065","type":"penarikan","tanggal":"2026-09-28","kategori":"Keperluan Darurat / Lainnya","keterangan":"??","penerima":"","nominal":10073761,"statusOwner":"pending","updatedAt":"2026-10-06T00:50:21.065Z","createdAt":"2026-10-06T00:50:21.065Z"},{"id":"TARIK-1791247688249","type":"penarikan","tanggal":"2026-09-27","kategori":"Prive / Bagi Hasil Owner","keterangan":"Prive cicilan Hutang","penerima":"Rek Mandiri Bp Swanto","nominal":7500000,"statusOwner":"approved","updatedAt":"2026-10-06T00:48:08.249Z","createdAt":"2026-10-06T00:48:08.249Z"},{"id":"TARIK-1791247614888","type":"penarikan","tanggal":"2026-09-27","kategori":"Gaji & Insentif Karyawan","keterangan":"Bayar Gaji","penerima":"Adis Setiawan ( kepala Toko )","nominal":12830000,"statusOwner":"approved","updatedAt":"2026-10-06T00:46:54.888Z","createdAt":"2026-10-06T00:46:54.888Z"},{"id":"TARIK-1790076045480","type":"penarikan","tanggal":"2026-09-22","kategori":"Biaya Admin / Bunga Bank","keterangan":"Biaya Listrik dan Beli peralatan cek aki","penerima":"","nominal":3226500,"statusOwner":"approved","updatedAt":"2026-09-22T11:20:45.480Z","createdAt":"2026-09-22T11:20:45.480Z"},{"id":"TARIK-1789956583708","type":"penarikan","tanggal":"2026-09-06","kategori":"Prive / Bagi Hasil Owner","keterangan":"Belanja Peralatan","penerima":"SAEFUDIN","nominal":2000000,"statusOwner":"approved","updatedAt":"2026-09-21T02:09:43.708Z","createdAt":"2026-09-21T02:09:43.708Z"},{"id":"RESTOK-1789956528819","type":"restok","tanggal":"2026-09-06","supplier":"AOP","kategori":"Aki & Baterai","nota":"","nama":"Belanja Barang Dagangan","nominal":57723505,"statusOwner":"approved","updatedAt":"2026-09-21T02:08:48.820Z","createdAt":"2026-09-21T02:08:48.820Z"},{"id":"TARIK-1789956438284","type":"penarikan","tanggal":"2026-09-02","kategori":"Biaya Admin / Bunga Bank","keterangan":"Biaya Bulanan Rekening","penerima":"Bank Mandiri","nominal":10500,"statusOwner":"approved","updatedAt":"2026-09-21T02:07:18.285Z","createdAt":"2026-09-21T02:07:18.285Z"},{"id":"TARIK-1789954072788","type":"penarikan","tanggal":"2026-09-20","kategori":"Pajak & Legalitas","keterangan":"PPH Final badan Agst 2026","penerima":"DJP","nominal":1188870,"statusOwner":"approved","updatedAt":"2026-09-21T01:27:52.789Z","createdAt":"2026-09-21T01:27:52.789Z"},{"id":"TARIK-1789954022540","type":"penarikan","tanggal":"2026-09-20","kategori":"Pajak & Legalitas","keterangan":"DJP","penerima":"PPN Agustus 2026","nominal":4664545,"statusOwner":"approved","updatedAt":"2026-09-21T01:27:02.540Z","createdAt":"2026-09-21T01:27:02.540Z"},{"id":"TARIK-1789953971068","type":"penarikan","tanggal":"2026-09-20","kategori":"Pajak & Legalitas","keterangan":"PPH21","penerima":"DJP","nominal":91250,"statusOwner":"approved","updatedAt":"2026-09-21T01:26:11.068Z","createdAt":"2026-09-21T01:26:11.068Z"},{"id":"TARIK-1789953898836","type":"penarikan","tanggal":"2026-09-18","kategori":"Biaya Admin / Bunga Bank","keterangan":"Biaya admin","penerima":"","nominal":2500,"statusOwner":"approved","updatedAt":"2026-09-21T01:24:58.836Z","createdAt":"2026-09-21T01:24:58.836Z"},{"id":"TARIK-1789953843524","type":"penarikan","tanggal":"2026-09-18","kategori":"Keperluan Darurat / Lainnya","keterangan":"Tarikan Kas untuk beli Oli tambahan","penerima":"KARTIKA","nominal":14450000,"statusOwner":"approved","updatedAt":"2026-09-21T01:24:03.524Z","createdAt":"2026-09-21T01:24:03.524Z"},{"id":"TARIK-1789953728437","type":"penarikan","tanggal":"2026-09-14","kategori":"Prive / Bagi Hasil Owner","keterangan":"Penarikan Owner","penerima":"Mandiri 1560004534105","nominal":20000000,"statusOwner":"approved","updatedAt":"2026-09-21T01:22:08.437Z","createdAt":"2026-09-21T01:22:08.437Z"},{"id":"RESTOK-1789953644394","type":"restok","tanggal":"2026-09-14","supplier":"AOP","kategori":"Aki & Baterai","nota":"","nama":"Barang dagangan Shop & Drive","nominal":66297436,"statusOwner":"approved","updatedAt":"2026-09-21T01:20:44.394Z","createdAt":"2026-09-21T01:20:44.394Z"},{"id":"RESTOK-1789953299477","type":"restok","tanggal":"2026-09-21","supplier":"AOP","kategori":"Sparepart & Onderdil","nota":"","nama":"Barang dagangan Shop And Drive","nominal":58324089,"statusOwner":"approved","updatedAt":"2026-09-21T01:14:59.477Z","createdAt":"2026-09-21T01:14:59.477Z"}],"records":[{"id":"REC-20261006-7866","tanggal":"2026-10-06","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":9147030,"penjualanBimaMotor":400000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":9547030,"transferMandiri":0,"cardEdc":8222020,"penghematanTradeIn":585000,"biayaOperasional":40000,"totalPengeluaranKas":8847020,"sisaUangKasKecil":700010,"fisikRiil":700000,"selisih":-10,"expenses":[{"id":1791288323418,"desc":"TALITIS","amount":40000}],"createdAt":"2026-10-06T12:05:47.866Z","sudahDiambil":false},{"id":"REC-20261005-1058","tanggal":"2026-10-05","kasir":"Satria jaka Surya","catatan":"","saldoAwal":0,"penjualanShopDrive":12428920,"penjualanBimaMotor":100000,"pemasukanLain":1200000,"keteranganPemasukanLain":"Penjualan Oli Bekas","totalPemasukan":13728920,"transferMandiri":2395000,"cardEdc":5316910,"penghematanTradeIn":705000,"biayaOperasional":0,"totalPengeluaranKas":8416910,"sisaUangKasKecil":5312010,"fisikRiil":5312000,"selisih":-10,"expenses":[],"createdAt":"2026-10-06T00:22:01.058Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-06T00:22:09.460Z"},{"id":"REC-20261004-3714","tanggal":"2026-10-04","kasir":"Satria jaka Surya","catatan":"","saldoAwal":0,"penjualanShopDrive":24767540,"penjualanBimaMotor":540000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":25307540,"transferMandiri":1680500,"cardEdc":18819530,"penghematanTradeIn":2210000,"biayaOperasional":1150000,"totalPengeluaranKas":23860030,"sisaUangKasKecil":1447510,"fisikRiil":1447500,"selisih":-10,"expenses":[{"id":1791245699079,"desc":"","amount":1150000}],"createdAt":"2026-10-06T00:15:43.714Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-06T00:22:14.515Z"},{"id":"REC-20261003-8456","tanggal":"2026-10-03","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":19374030,"penjualanBimaMotor":520000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":19894030,"transferMandiri":500000,"cardEdc":11974030,"penghematanTradeIn":593000,"biayaOperasional":20000,"totalPengeluaranKas":13087030,"sisaUangKasKecil":6807000,"fisikRiil":6807000,"selisih":0,"expenses":[{"id":1791245539554,"desc":"","amount":20000}],"createdAt":"2026-10-06T00:12:48.456Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-06T00:22:37.921Z"},{"id":"REC-20261002-5865","tanggal":"2026-10-02","kasir":"Satria jaka Surya","catatan":"","saldoAwal":0,"penjualanShopDrive":7747510,"penjualanBimaMotor":80000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":7827510,"transferMandiri":0,"cardEdc":6565510,"penghematanTradeIn":394000,"biayaOperasional":0,"totalPengeluaranKas":6959510,"sisaUangKasKecil":868000,"fisikRiil":868000,"selisih":0,"expenses":[],"createdAt":"2026-10-06T00:10:45.865Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-06T00:22:34.018Z"},{"id":"REC-20261001-9643","tanggal":"2026-10-01","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":11853030,"penjualanBimaMotor":0,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":11853030,"transferMandiri":3601010,"cardEdc":5289000,"penghematanTradeIn":577000,"biayaOperasional":190000,"totalPengeluaranKas":9657010,"sisaUangKasKecil":2196020,"fisikRiil":2196000,"selisih":-20,"expenses":[{"id":1791245279960,"desc":"","amount":190000}],"createdAt":"2026-10-06T00:08:49.643Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-06T00:22:28.950Z"},{"id":"REC-20260930-5770","tanggal":"2026-09-30","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":13128020,"penjualanBimaMotor":250000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":13378020,"transferMandiri":3601010,"cardEdc":9035010,"penghematanTradeIn":492000,"biayaOperasional":100000,"totalPengeluaranKas":13228020,"sisaUangKasKecil":150000,"fisikRiil":150000,"selisih":0,"expenses":[{"id":1791245163967,"desc":"","amount":100000}],"createdAt":"2026-10-06T00:06:25.770Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-06T00:06:34.013Z"},{"id":"REC-20260929-9983","tanggal":"2026-09-29","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":11137020,"penjualanBimaMotor":0,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":11137020,"transferMandiri":0,"cardEdc":7744020,"penghematanTradeIn":602000,"biayaOperasional":144000,"totalPengeluaranKas":8490020,"sisaUangKasKecil":2647000,"fisikRiil":2647000,"selisih":0,"expenses":[{"id":1791244921410,"desc":"","amount":144000}],"createdAt":"2026-10-06T00:03:49.983Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-06T00:03:57.525Z"},{"id":"REC-20260928-9465","tanggal":"2026-09-28","kasir":"Satria jaka Surya","catatan":"","saldoAwal":0,"penjualanShopDrive":13981030,"penjualanBimaMotor":0,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":13981030,"transferMandiri":1935000,"cardEdc":9708010,"penghematanTradeIn":980000,"biayaOperasional":78000,"totalPengeluaranKas":12701010,"sisaUangKasKecil":1280020,"fisikRiil":1280000,"selisih":-20,"expenses":[{"id":1791244648400,"desc":"","amount":78000}],"createdAt":"2026-10-05T23:58:19.465Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-05T23:58:34.204Z"},{"id":"REC-20260927-9362","tanggal":"2026-09-27","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":16896050,"penjualanBimaMotor":0,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":16896050,"transferMandiri":2575010,"cardEdc":12593520,"penghematanTradeIn":1362000,"biayaOperasional":0,"totalPengeluaranKas":16530530,"sisaUangKasKecil":365520,"fisikRiil":365520,"selisih":0,"expenses":[],"createdAt":"2026-10-05T23:53:49.362Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-05T23:58:41.252Z"},{"id":"REC-20260926-9937","tanggal":"2026-09-26","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":15411530,"penjualanBimaMotor":0,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":15411530,"transferMandiri":1865000,"cardEdc":9592520,"penghematanTradeIn":944000,"biayaOperasional":41500,"totalPengeluaranKas":12443020,"sisaUangKasKecil":2968510,"fisikRiil":2968510,"selisih":0,"expenses":[{"id":1791243627431,"desc":"","amount":41500}],"createdAt":"2026-10-05T23:41:39.937Z","sudahDiambil":true,"statusUpdatedAt":"2026-10-05T23:58:47.711Z"},{"id":"REC-20260925-5992","tanggal":"2026-09-25","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":9147030,"penjualanBimaMotor":400000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":9547030,"transferMandiri":0,"cardEdc":8222020,"penghematanTradeIn":585000,"biayaOperasional":40000,"totalPengeluaranKas":8847020,"sisaUangKasKecil":700010,"fisikRiil":700000,"selisih":-10,"expenses":[{"id":1791288124036,"desc":"TALITIS","amount":40000}],"createdAt":"2026-10-06T12:04:15.322Z","sudahDiambil":true},{"id":"REC-1791242000785","tanggal":"2026-09-24","kasir":"Satria jaka Surya","catatan":"","saldoAwal":0,"penjualanShopDrive":5089040,"penjualanBimaMotor":0,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":5089040,"transferMandiri":772000,"cardEdc":3761030,"penghematanTradeIn":493000,"biayaOperasional":0,"totalPengeluaranKas":5026030,"sisaUangKasKecil":63010,"fisikRiil":63000,"selisih":-10,"expenses":[],"createdAt":"2026-10-05T23:13:20.785Z","sudahDiambil":true},{"id":"REC-1791241793408","tanggal":"2026-09-23","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":10111530,"penjualanBimaMotor":400000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":10511530,"transferMandiri":807000,"cardEdc":7762520,"penghematanTradeIn":492000,"biayaOperasional":0,"totalPengeluaranKas":9061520,"sisaUangKasKecil":1450010,"fisikRiil":1450000,"selisih":-10,"expenses":[],"createdAt":"2026-10-05T23:10:13.714Z","sudahDiambil":true},{"id":"REC-1791239697215","tanggal":"2026-09-22","kasir":"Satria jaka Surya","catatan":"","saldoAwal":0,"penjualanShopDrive":17400040,"penjualanBimaMotor":260000,"pemasukanLain":0,"keteranganPemasukanLain":"","totalPemasukan":17660040,"transferMandiri":4925020,"cardEdc":11440020,"penghematanTradeIn":1143000,"biayaOperasional":20000,"totalPengeluaranKas":17528040,"sisaUangKasKecil":132000,"fisikRiil":132000,"selisih":0,"expenses":[{"id":1791239656716,"desc":"Bensin","amount":20000}],"createdAt":"2026-10-05T22:35:44.516Z","sudahDiambil":true},{"id":"REC-1789996551365","tanggal":"2026-09-21","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":13465030,"penjualanBimaMotor":400000,"totalPemasukan":13865030,"transferMandiri":0,"cardEdc":6556520,"penghematanTradeIn":835000,"biayaOperasional":3226500,"totalPengeluaranKas":10618020,"sisaUangKasKecil":3247010,"fisikRiil":3247500,"selisih":490,"expenses":[{"id":1789996469714,"desc":"Peralatan","amount":1126500},{"id":1790075541602,"desc":"Bayar Listrik September","amount":2100000}],"createdAt":"2026-09-22T11:13:16.786Z","sudahDiambil":true},{"id":"REC-1789956130028","tanggal":"2026-09-20","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":14488550,"penjualanBimaMotor":100000,"totalPemasukan":14588550,"transferMandiri":2237020,"cardEdc":10971030,"penghematanTradeIn":1389000,"biayaOperasional":60000,"totalPengeluaranKas":14657050,"sisaUangKasKecil":-68500,"fisikRiil":0,"selisih":68500,"expenses":[{"id":1789956094196,"desc":"Bensin BHD","amount":40000},{"id":1789956106565,"desc":"Isolasi","amount":20000},{"id":1789956118531,"desc":"","amount":0}],"createdAt":"2026-09-21T02:02:10.028Z","sudahDiambil":true},{"id":"REC-1789955734372","tanggal":"2026-09-19","kasir":"Adis","catatan":"","saldoAwal":0,"penjualanShopDrive":10429030,"penjualanBimaMotor":300000,"totalPemasukan":10729030,"transferMandiri":0,"cardEdc":8983020,"penghematanTradeIn":554000,"biayaOperasional":20000,"totalPengeluaranKas":9557020,"sisaUangKasKecil":1172010,"fisikRiil":1172000,"selisih":-10,"expenses":[{"id":1789955667757,"desc":"Lem campur","amount":20000}],"createdAt":"2026-09-21T01:55:34.372Z","sudahDiambil":true},{"id":"REC-1789955861700","tanggal":"2026-09-18","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":7558020,"penjualanBimaMotor":0,"totalPemasukan":7558020,"transferMandiri":1921010,"cardEdc":4494010,"penghematanTradeIn":357000,"biayaOperasional":50000,"totalPengeluaranKas":6822020,"sisaUangKasKecil":736000,"fisikRiil":736000,"selisih":0,"expenses":[{"id":1789955822307,"desc":"Bensin BHD/DOI","amount":50000}],"createdAt":"2026-09-21T01:57:41.700Z","sudahDiambil":true},{"id":"REC-1789654273220","tanggal":"2026-09-17","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":9812520,"penjualanBimaMotor":400000,"totalPemasukan":10212520,"transferMandiri":3247000,"cardEdc":4889510,"penghematanTradeIn":397000,"biayaOperasional":115000,"totalPengeluaranKas":8648510,"sisaUangKasKecil":1564010,"fisikRiil":1564000,"selisih":-10,"expenses":[{"id":1789654206531,"desc":"Tagihan kartu simpati","amount":115000}],"createdAt":"2026-09-17T14:11:13.220Z","sudahDiambil":true},{"id":"REC-1789604109532","tanggal":"2026-09-16","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":4429500,"penjualanBimaMotor":200000,"totalPemasukan":4629500,"transferMandiri":2684500,"cardEdc":1743000,"penghematanTradeIn":202000,"biayaOperasional":0,"totalPengeluaranKas":4629500,"sisaUangKasKecil":0,"fisikRiil":0,"selisih":0,"expenses":[],"createdAt":"2026-09-17T00:15:09.532Z","sudahDiambil":true},{"id":"REC-1789529482044","tanggal":"2026-09-15","kasir":"Surya","catatan":"","saldoAwal":0,"penjualanShopDrive":8822020,"penjualanBimaMotor":100000,"totalPemasukan":8922020,"transferMandiri":135500,"cardEdc":5714510,"penghematanTradeIn":910000,"biayaOperasional":0,"totalPengeluaranKas":6760010,"sisaUangKasKecil":2162010,"fisikRiil":2162000,"selisih":-10,"expenses":[],"createdAt":"2026-09-16T03:31:22.044Z","sudahDiambil":true},{"id":"REC-1789391132957","tanggal":"2026-09-14","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":11267000,"penjualanBimaMotor":200000,"totalPemasukan":11467000,"transferMandiri":5155010,"cardEdc":4367000,"penghematanTradeIn":586000,"biayaOperasional":100000,"totalPengeluaranKas":10208010,"sisaUangKasKecil":1258990,"fisikRiil":1258900,"selisih":-90,"expenses":[{"id":1789391034732,"desc":"Iuran Bulanan RT","amount":100000}],"createdAt":"2026-09-14T13:05:32.957Z","sudahDiambil":true},{"id":"REC-1789308029651","tanggal":"2026-09-13","kasir":"Adis Setiawan","catatan":"","saldoAwal":0,"penjualanShopDrive":18319530,"penjualanBimaMotor":500000,"totalPemasukan":18819530,"transferMandiri":514000,"cardEdc":16783510,"penghematanTradeIn":862000,"biayaOperasional":75000,"totalPengeluaranKas":18234510,"sisaUangKasKecil":585020,"fisikRiil":585000,"selisih":-20,"expenses":[{"id":1789307977288,"desc":"Sabun Pel","amount":45000},{"id":1789307991801,"desc":"Minyak BHD","amount":30000}],"createdAt":"2026-09-13T14:00:29.651Z","sudahDiambil":true},{"id":"REC-1789309165009","tanggal":"2026-09-12","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":19063058,"penjualanBimaMotor":600000,"totalPemasukan":19663058,"transferMandiri":3109010,"cardEdc":15050540,"penghematanTradeIn":1316000,"biayaOperasional":30000,"totalPengeluaranKas":19505550,"sisaUangKasKecil":157508,"fisikRiil":158500,"selisih":992,"expenses":[{"id":1789301677885,"desc":"Bensin BHD","amount":30000}],"createdAt":"2026-09-13T14:19:25.009Z","sudahDiambil":true},{"id":"REC-1789301578709","tanggal":"2026-09-11","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":13140040,"penjualanBimaMotor":100000,"totalPemasukan":13240040,"transferMandiri":0,"cardEdc":10482020,"penghematanTradeIn":783000,"biayaOperasional":0,"totalPengeluaranKas":11265020,"sisaUangKasKecil":1975020,"fisikRiil":1975000,"selisih":-20,"expenses":[],"createdAt":"2026-09-13T12:12:58.709Z","sudahDiambil":true},{"id":"REC-1789301495996","tanggal":"2026-09-10","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":12429640,"penjualanBimaMotor":200000,"totalPemasukan":12629640,"transferMandiri":1316000,"cardEdc":10151640,"penghematanTradeIn":769000,"biayaOperasional":20000,"totalPengeluaranKas":12256640,"sisaUangKasKecil":373000,"fisikRiil":373000,"selisih":0,"expenses":[{"id":1789301469959,"desc":"Minyak BHD","amount":20000}],"createdAt":"2026-09-13T12:11:35.996Z","sudahDiambil":true},{"id":"REC-1789301399517","tanggal":"2026-09-09","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":7429040,"penjualanBimaMotor":200000,"totalPemasukan":7629040,"transferMandiri":0,"cardEdc":6777040,"penghematanTradeIn":652000,"biayaOperasional":0,"totalPengeluaranKas":7429040,"sisaUangKasKecil":200000,"fisikRiil":200000,"selisih":0,"expenses":[],"createdAt":"2026-09-13T12:09:59.517Z","sudahDiambil":true},{"id":"REC-1789301326469","tanggal":"2026-09-08","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":10329050,"penjualanBimaMotor":200000,"totalPemasukan":10529050,"transferMandiri":3928010,"cardEdc":3984510,"penghematanTradeIn":579000,"biayaOperasional":130000,"totalPengeluaranKas":8621520,"sisaUangKasKecil":1907530,"fisikRiil":1907500,"selisih":-30,"expenses":[{"id":1789301273549,"desc":"Air Gun Kompressor","amount":100000},{"id":1789301288205,"desc":"Bensin BHD","amount":30000}],"createdAt":"2026-09-13T12:08:46.470Z","sudahDiambil":true},{"id":"REC-1789301198318","tanggal":"2026-09-07","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":12209020,"penjualanBimaMotor":500000,"totalPemasukan":12709020,"transferMandiri":1226000,"cardEdc":8437000,"penghematanTradeIn":622000,"biayaOperasional":2381000,"totalPengeluaranKas":12666000,"sisaUangKasKecil":43020,"fisikRiil":43000,"selisih":-20,"expenses":[{"id":1789301148973,"desc":"Transfer PT Afta 2 September ","amount":2381000}],"createdAt":"2026-09-13T12:06:38.318Z","sudahDiambil":true},{"id":"REC-1789301092596","tanggal":"2026-09-06","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":10231510,"penjualanBimaMotor":300000,"totalPemasukan":10531510,"transferMandiri":0,"cardEdc":9836510,"penghematanTradeIn":695000,"biayaOperasional":0,"totalPengeluaranKas":10531510,"sisaUangKasKecil":0,"fisikRiil":0,"selisih":0,"expenses":[],"createdAt":"2026-09-13T12:04:52.596Z","sudahDiambil":true},{"id":"REC-1789301019285","tanggal":"2026-09-05","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":23956530,"penjualanBimaMotor":200000,"totalPemasukan":24156530,"transferMandiri":4842010,"cardEdc":17243520,"penghematanTradeIn":1093000,"biayaOperasional":165000,"totalPengeluaranKas":23343530,"sisaUangKasKecil":813000,"fisikRiil":813000,"selisih":0,"expenses":[{"id":1789300956165,"desc":"Cetak Spanduk Aki","amount":100000},{"id":1789300970966,"desc":"Bensin BHD","amount":40000},{"id":1789300985196,"desc":"Sabun Pel","amount":25000}],"createdAt":"2026-09-13T12:03:39.285Z","sudahDiambil":true},{"id":"REC-1789300880459","tanggal":"2026-09-04","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":9938010,"penjualanBimaMotor":0,"totalPemasukan":9938010,"transferMandiri":7316010,"cardEdc":1730000,"penghematanTradeIn":265000,"biayaOperasional":35000,"totalPengeluaranKas":9346010,"sisaUangKasKecil":592000,"fisikRiil":592000,"selisih":0,"expenses":[{"id":1789300834181,"desc":"Air Galon ","amount":35000}],"createdAt":"2026-09-13T12:01:20.459Z","sudahDiambil":true},{"id":"REC-1789300775446","tanggal":"2026-09-03","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":7771010,"penjualanBimaMotor":0,"totalPemasukan":7771010,"transferMandiri":2096510,"cardEdc":4279500,"penghematanTradeIn":648000,"biayaOperasional":210000,"totalPengeluaranKas":7234010,"sisaUangKasKecil":537000,"fisikRiil":537000,"selisih":0,"expenses":[{"id":1789300721388,"desc":"Bensin BHD","amount":20000},{"id":1789300735364,"desc":"BPJS Rengga","amount":190000}],"createdAt":"2026-09-13T11:59:35.446Z","sudahDiambil":true},{"id":"REC-1789301941852","tanggal":"2026-09-02","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":8057020,"penjualanBimaMotor":0,"totalPemasukan":8057020,"transferMandiri":2264000,"cardEdc":3994510,"penghematanTradeIn":488000,"biayaOperasional":0,"totalPengeluaranKas":6746510,"sisaUangKasKecil":1310510,"fisikRiil":1310500,"selisih":-10,"expenses":[],"createdAt":"2026-09-13T12:19:01.852Z","sudahDiambil":true},{"id":"REC-1789300563188","tanggal":"2026-09-01","kasir":"Kasir","catatan":"","saldoAwal":0,"penjualanShopDrive":9387520,"penjualanBimaMotor":0,"totalPemasukan":9387520,"transferMandiri":544500,"cardEdc":7100020,"penghematanTradeIn":585000,"biayaOperasional":75000,"totalPengeluaranKas":8304520,"sisaUangKasKecil":1083000,"fisikRiil":1083000,"selisih":0,"expenses":[{"id":1789300493581,"desc":"Motor BHD","amount":15000},{"id":1789300506268,"desc":"Minyak BHD","amount":40000},{"id":1789300517500,"desc":"Sabun Pel","amount":20000}],"createdAt":"2026-09-13T11:56:03.188Z","sudahDiambil":true}]};
if (typeof window !== 'undefined') {
  window.BUNDLED_KAS_DATABASE = BUNDLED_KAS_DATABASE;
}

// Storage Keys
const KAS_STORAGE_KEY = 'kas_bengkel_shop_drive_bima_v1';
const BANK_TRANSACTIONS_KEY = 'bank_mandiri_transactions_v1';
const BANK_SETTINGS_KEY = 'bank_mandiri_settings_v1';

// State variables
let currentPeriodFilter = 'all'; // 'all', 'this_month', 'today'
let currentSearchQuery = '';
let currentOwnerFilter = 'all'; // 'all', 'approved', 'pending', 'rejected'
let activeTab = 'restok'; // 'restok', 'penarikan', 'inflow'

// Utility: Format Rupiah
function formatRupiah(number) {
  const num = Number(number) || 0;
  return 'Rp ' + Math.floor(num).toLocaleString('id-ID');
}

// Utility: Parse Number
function parseNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const clean = str.toString().replace(/[^0-9-]/g, '');
  return parseInt(clean, 10) || 0;
}

// Utility: Setup reactive number input
function setupNumberInput(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('focus', function () {
    const rawVal = parseNumber(this.value);
    this.value = rawVal === 0 ? '' : rawVal;
  });

  inputEl.addEventListener('input', function () {
    const rawVal = parseNumber(this.value);
    if (this.value !== '') {
      this.value = rawVal.toLocaleString('id-ID');
    }
  });

  inputEl.addEventListener('blur', function () {
    const rawVal = parseNumber(this.value);
    this.value = rawVal.toLocaleString('id-ID');
  });
}

// -------------------------------------------------------------
// TOAST NOTIFICATION HELPER
// -------------------------------------------------------------
function showBankToast(message, type = 'success') {
  let toastContainer = document.getElementById('bankToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'bankToastContainer';
    toastContainer.className = 'fixed bottom-5 right-5 z-[10000] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'error' 
    ? 'bg-rose-950 border-rose-600 text-white shadow-rose-950/50' 
    : (type === 'warning' ? 'bg-amber-950 border-amber-500 text-white shadow-amber-950/50' : 'bg-slate-950 border-blue-500 text-white shadow-blue-950/50');
  const icon = type === 'error' ? 'fa-circle-xmark text-rose-400' : (type === 'warning' ? 'fa-triangle-exclamation text-amber-400' : 'fa-circle-check text-emerald-400');

  toast.className = `${bgClass} border shadow-2xl rounded-2xl p-4 text-xs font-semibold flex items-start gap-3 pointer-events-auto transform transition-all duration-300 translate-y-3 opacity-0`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base mt-0.5 shrink-0"></i>
    <div class="flex-1 whitespace-pre-line leading-relaxed">${message}</div>
    <button type="button" class="text-white/60 hover:text-white shrink-0 ml-1">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;

  toast.querySelector('button').addEventListener('click', () => {
    toast.remove();
  });

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// -------------------------------------------------------------
// STORAGE & DATA ACCESS HELPERS
// -------------------------------------------------------------

function getBankSettings() {
  try {
    const raw = localStorage.getItem(BANK_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading bank settings:', e);
  }
  if (typeof window !== 'undefined' && window.BUNDLED_KAS_DATABASE && window.BUNDLED_KAS_DATABASE.bankSettings) {
    const bs = window.BUNDLED_KAS_DATABASE.bankSettings;
    return {
      saldoAwal: bs.saldoAwal || bs.saldoBulanLalu || 29384422,
      saldoBulanLalu: bs.saldoBulanLalu || 29384422,
      accountName: bs.accountName || 'Bank Mandiri - 1560023250204',
      ownerName: bs.ownerName || 'PT DUTARAYA BERJAYA',
      bengkelName: 'Shop & Drive & Bima Motor'
    };
  }
  return {
    saldoAwal: 29384422,
    saldoBulanLalu: 29384422,
    accountName: 'Bank Mandiri - 1560023250204',
    ownerName: 'PT DUTARAYA BERJAYA',
    bengkelName: 'Shop & Drive & Bima Motor'
  };
}

function saveBankSettings(settings) {
  try {
    localStorage.setItem(BANK_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving bank settings:', e);
  }
}

function getBankTransactions() {
  try {
    const raw = localStorage.getItem(BANK_TRANSACTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading bank transactions:', e);
  }
  if (typeof window !== 'undefined' && window.BUNDLED_KAS_DATABASE && Array.isArray(window.BUNDLED_KAS_DATABASE.bankTransactions)) {
    return window.BUNDLED_KAS_DATABASE.bankTransactions;
  }
  return [];
}

function saveBankTransactions(txs) {
  try {
    localStorage.setItem(BANK_TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error('Error saving bank transactions:', e);
  }
}

function getKasRecords() {
  try {
    const raw = localStorage.getItem(KAS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading kas records:', e);
  }
  if (typeof window !== 'undefined' && window.BUNDLED_KAS_DATABASE && Array.isArray(window.BUNDLED_KAS_DATABASE.records)) {
    return window.BUNDLED_KAS_DATABASE.records;
  }
  return [];
}

// Inisialisasi otomatis data ke localStorage jika masih kosong / belum lengkap
function initBankDataIfEmpty() {
  try {
    const currentBankRaw = localStorage.getItem(BANK_TRANSACTIONS_KEY);
    let currentBank = currentBankRaw ? JSON.parse(currentBankRaw) : [];
    if (!Array.isArray(currentBank) || currentBank.length < 19) {
      const seedTxs = (typeof BUNDLED_KAS_DATABASE !== 'undefined' && Array.isArray(BUNDLED_KAS_DATABASE.bankTransactions))
        ? BUNDLED_KAS_DATABASE.bankTransactions : [];
      let merged = Array.isArray(currentBank) ? [...currentBank] : [];
      seedTxs.forEach(t => {
        if (!merged.some(m => m.id === t.id)) merged.push(t);
      });
      merged.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      localStorage.setItem(BANK_TRANSACTIONS_KEY, JSON.stringify(merged));
    }

    const currentKasRaw = localStorage.getItem(KAS_STORAGE_KEY);
    let currentKas = currentKasRaw ? JSON.parse(currentKasRaw) : [];
    if (!Array.isArray(currentKas) || currentKas.length < 35) {
      const seedKas = (typeof BUNDLED_KAS_DATABASE !== 'undefined' && Array.isArray(BUNDLED_KAS_DATABASE.records))
        ? BUNDLED_KAS_DATABASE.records : [];
      let mergedKas = Array.isArray(currentKas) ? [...currentKas] : [];
      seedKas.forEach(r => {
        if (!mergedKas.some(m => m.id === r.id || (m.tanggal === r.tanggal && m.tanggal))) mergedKas.push(r);
      });
      mergedKas.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      localStorage.setItem(KAS_STORAGE_KEY, JSON.stringify(mergedKas));
    }

    const currentSettingsRaw = localStorage.getItem(BANK_SETTINGS_KEY);
    const currentSettings = currentSettingsRaw ? JSON.parse(currentSettingsRaw) : null;
    if (!currentSettings || !currentSettings.saldoAwal || currentSettings.saldoAwal === 0) {
      const initSettings = {
        saldoAwal: 29384422,
        saldoBulanLalu: 29384422,
        accountName: 'Bank Mandiri - 1560023250204',
        ownerName: 'PT DUTARAYA BERJAYA',
        bengkelName: 'Shop & Drive & Bima Motor'
      };
      localStorage.setItem(BANK_SETTINGS_KEY, JSON.stringify(initSettings));
    }
  } catch (err) {
    console.warn('Inisialisasi data bank Mandiri:', err);
  }
}

// Sinkronisasi data kasir dan database terpusat
async function syncFromKasirAndDatabase() {
  const btn = document.getElementById('btnSyncFromKasir');
  const oldHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-blue-600"></i> Menyinkronkan...';
  }

  let sourceKas = null;
  let sourceBank = null;
  let sourceSettings = null;

  try {
    const res = await fetch('database_kas_bengkel.json');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.records) && data.records.length > 0) sourceKas = data.records;
      if (data && Array.isArray(data.bankTransactions) && data.bankTransactions.length > 0) sourceBank = data.bankTransactions;
      if (data && data.bankSettings) sourceSettings = data.bankSettings;
    }
  } catch (e) {
    // Abaikan error jaringan atau CORS
  }

  if (!sourceKas && typeof window !== 'undefined' && window.BUNDLED_KAS_DATABASE && Array.isArray(window.BUNDLED_KAS_DATABASE.records)) {
    sourceKas = window.BUNDLED_KAS_DATABASE.records;
  }
  if (!sourceBank && typeof window !== 'undefined' && window.BUNDLED_KAS_DATABASE && Array.isArray(window.BUNDLED_KAS_DATABASE.bankTransactions)) {
    sourceBank = window.BUNDLED_KAS_DATABASE.bankTransactions;
  }
  if (!sourceSettings && typeof window !== 'undefined' && window.BUNDLED_KAS_DATABASE && window.BUNDLED_KAS_DATABASE.bankSettings) {
    sourceSettings = window.BUNDLED_KAS_DATABASE.bankSettings;
  }

  const currentKas = getKasRecords();
  let mergedKas = [...currentKas];
  if (sourceKas && sourceKas.length > 0) {
    sourceKas.forEach(item => {
      const exists = mergedKas.some(k => k.id === item.id || (k.tanggal === item.tanggal && k.tanggal));
      if (!exists) {
        mergedKas.push(item);
      }
    });
    mergedKas.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    localStorage.setItem(KAS_STORAGE_KEY, JSON.stringify(mergedKas));
  }

  const currentBank = getBankTransactions();
  let mergedBank = [...currentBank];
  if (sourceBank && sourceBank.length > 0) {
    sourceBank.forEach(item => {
      const exists = mergedBank.some(b => b.id === item.id);
      if (!exists) {
        mergedBank.push(item);
      }
    });
    mergedBank.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    saveBankTransactions(mergedBank);
  }

  if (sourceSettings && !localStorage.getItem(BANK_SETTINGS_KEY)) {
    saveBankSettings({
      saldoAwal: sourceSettings.saldoAwal || sourceSettings.saldoBulanLalu || 29384422,
      saldoBulanLalu: sourceSettings.saldoBulanLalu || 29384422,
      accountName: sourceSettings.accountName || 'Bank Mandiri - 1560023250204',
      ownerName: sourceSettings.ownerName || 'PT DUTARAYA BERJAYA',
      bengkelName: 'Shop & Drive & Bima Motor'
    });
  }

  renderAllViews();

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = oldHtml;
  }

  const saldoTerhitung = recalculateBankLedger().perkiraanSaldoBank;
  alert(`Sinkronisasi Sukses!\n\n✅ ${mergedKas.length} Catatan Penerimaan Kasir Terhubung\n✅ ${mergedBank.length} Transaksi Rekening Mandiri Termutakhirkan\n✅ Perkiraan Saldo Bank Mandiri: ${formatRupiah(saldoTerhitung)}`);
  showBankToast(`Sinkronisasi Sukses!\n✅ ${mergedKas.length} Catatan Penerimaan Kasir\n✅ ${mergedBank.length} Transaksi Rekening Mandiri Termutakhirkan`, 'success');
}

// -------------------------------------------------------------
// FILTERING HELPER
// -------------------------------------------------------------

function isDateInPeriod(dateStr, period) {
  if (!dateStr || period === 'all') return true;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const thisMonthPrefix = `${yyyy}-${mm}`;

  if (period === 'today') {
    return dateStr === todayStr;
  }
  if (period === 'this_month') {
    return dateStr.startsWith(thisMonthPrefix);
  }
  return true;
}

// -------------------------------------------------------------
// CALCULATIONS & METRICS UPDATE
// -------------------------------------------------------------

function recalculateBankLedger() {
  const settings = getBankSettings();
  const saldoAwal = Number(settings.saldoAwal || 0);
  const allTxs = getBankTransactions();
  const kasRecords = getKasRecords();

  // Filter transactions based on current period
  const filteredTxs = allTxs.filter(tx => isDateInPeriod(tx.tanggal, currentPeriodFilter));
  const filteredKas = kasRecords.filter(rec => isDateInPeriod(rec.tanggal, currentPeriodFilter));

  // 1. Calculate Non-Cash Inflow from Kasir
  const sumTransferMandiri = filteredKas.reduce((sum, r) => sum + (Number(r.transferMandiri) || 0), 0);
  const sumCardEdc = filteredKas.reduce((sum, r) => sum + (Number(r.cardEdc) || 0), 0);
  const totalInflowKasir = sumTransferMandiri + sumCardEdc;

  // 2. Calculate Restok Bahan (Pembelian Bahan)
  const restokList = filteredTxs.filter(tx => tx.type === 'restok');
  const totalRestokBahan = restokList.reduce((sum, tx) => sum + (Number(tx.nominal) || 0), 0);

  // 3. Calculate Penarikan Lain
  const penarikanList = filteredTxs.filter(tx => tx.type === 'penarikan');
  const totalPenarikanLain = penarikanList.reduce((sum, tx) => sum + (Number(tx.nominal) || 0), 0);

  // 4. Total Outflow & Perkiraan Saldo Bank Mandiri
  const totalOutflowBank = totalRestokBahan + totalPenarikanLain;
  const perkiraanSaldoBank = saldoAwal + totalInflowKasir - totalOutflowBank;

  // Pending validation count
  const pendingCount = filteredTxs.filter(tx => tx.statusOwner === 'pending').length;

  // Update Top Metric Cards
  const elPerkiraan = document.getElementById('cardPerkiraanSaldoBank');
  if (elPerkiraan) elPerkiraan.innerText = formatRupiah(perkiraanSaldoBank);

  const elSaldoAwal = document.getElementById('cardSaldoAwalBank');
  if (elSaldoAwal) elSaldoAwal.innerText = formatRupiah(saldoAwal);

  const elInflowBadge = document.getElementById('cardInflowBadge');
  if (elInflowBadge) elInflowBadge.innerText = `+${formatRupiah(totalInflowKasir)}`;

  const elOutflowBadge = document.getElementById('cardOutflowBadge');
  if (elOutflowBadge) elOutflowBadge.innerText = `-${formatRupiah(totalOutflowBank)}`;

  const elPenerimaanKasir = document.getElementById('cardTotalPenerimaanKasir');
  if (elPenerimaanKasir) elPenerimaanKasir.innerText = formatRupiah(totalInflowKasir);

  const elSubTransfer = document.getElementById('cardSubTransferMandiri');
  if (elSubTransfer) elSubTransfer.innerText = formatRupiah(sumTransferMandiri);

  const elSubEdc = document.getElementById('cardSubCardEdc');
  if (elSubEdc) elSubEdc.innerText = formatRupiah(sumCardEdc);

  const elTotalRestok = document.getElementById('cardTotalRestokBahan');
  if (elTotalRestok) elTotalRestok.innerText = formatRupiah(totalRestokBahan);

  const elCountRestok = document.getElementById('cardCountRestok');
  if (elCountRestok) elCountRestok.innerText = `${restokList.length} Transaksi Restok`;

  const elTotalPenarikan = document.getElementById('cardTotalPenarikanLain');
  if (elTotalPenarikan) elTotalPenarikan.innerText = formatRupiah(totalPenarikanLain);

  const elCountPenarikan = document.getElementById('cardCountPenarikan');
  if (elCountPenarikan) elCountPenarikan.innerText = `${penarikanList.length} Penarikan`;

  const elPendingBadge = document.getElementById('cardPendingValidationBadge');
  if (elPendingBadge) {
    if (pendingCount > 0) {
      elPendingBadge.className = 'text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200';
      elPendingBadge.innerText = `⏳ ${pendingCount} Perlu Validasi`;
    } else {
      elPendingBadge.className = 'text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200';
      elPendingBadge.innerText = `✅ Semua Tervalidasi`;
    }
  }

  // Update Bottom Summary Strip
  const elSumInflow = document.getElementById('summaryTotalInflow');
  if (elSumInflow) elSumInflow.innerText = `+${formatRupiah(totalInflowKasir)}`;

  const elSumOutflow = document.getElementById('summaryTotalOutflow');
  if (elSumOutflow) elSumOutflow.innerText = `-${formatRupiah(totalOutflowBank)}`;

  const elSumSaldo = document.getElementById('summaryPerkiraanSaldo');
  if (elSumSaldo) elSumSaldo.innerText = formatRupiah(perkiraanSaldoBank);

  const elAccountInfo = document.getElementById('bankAccountInfoLabel');
  if (elAccountInfo) elAccountInfo.innerText = settings.accountName || 'Rekening Operasional Bengkel';

  // Badges in Tabs
  const badgeRestok = document.getElementById('badgeTabRestokCount');
  if (badgeRestok) badgeRestok.innerText = restokList.length;

  const badgePenarikan = document.getElementById('badgeTabPenarikanCount');
  if (badgePenarikan) badgePenarikan.innerText = penarikanList.length;

  const badgeInflow = document.getElementById('badgeTabInflowCount');
  if (badgeInflow) badgeInflow.innerText = filteredKas.length;

  return {
    saldoAwal,
    sumTransferMandiri,
    sumCardEdc,
    totalInflowKasir,
    totalRestokBahan,
    totalPenarikanLain,
    totalOutflowBank,
    perkiraanSaldoBank,
    restokList,
    penarikanList,
    filteredKas,
    settings
  };
}

// -------------------------------------------------------------
// RENDERERS: TABLES (RESTOK, PENARIKAN, INFLOW)
// -------------------------------------------------------------

function renderStatusOwnerBadge(status, txId, txType) {
  if (status === 'approved') {
    return `
      <div class="inline-flex items-center gap-1">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
          <i class="fa-solid fa-check text-emerald-600 mr-0.5"></i> Disetujui Owner
        </span>
      </div>
    `;
  } else if (status === 'rejected') {
    return `
      <div class="inline-flex items-center gap-1">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
          <i class="fa-solid fa-xmark text-rose-600 mr-0.5"></i> Ditolak
        </span>
      </div>
    `;
  } else {
    return `
      <button type="button" class="btn-quick-validate px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 shadow-2xs transition cursor-pointer" 
        data-id="${txId}" data-type="${txType}" title="Klik untuk validasi owner">
        <i class="fa-solid fa-clock text-amber-600 mr-0.5"></i> Menunggu Validasi
      </button>
    `;
  }
}

// 1. Render Tabel Restok Bahan
function renderRestokTable() {
  const tbody = document.getElementById('tableBodyRestok');
  const tfoot = document.getElementById('tableFootRestok');
  const emptyNotice = document.getElementById('emptyRestokNotice');
  if (!tbody) return;

  const allTxs = getBankTransactions();
  let list = allTxs.filter(tx => tx.type === 'restok');

  // Filter Period
  list = list.filter(tx => isDateInPeriod(tx.tanggal, currentPeriodFilter));

  // Filter Search
  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    list = list.filter(tx =>
      (tx.supplier || '').toLowerCase().includes(q) ||
      (tx.nama || '').toLowerCase().includes(q) ||
      (tx.kategori || '').toLowerCase().includes(q) ||
      (tx.nota || '').toLowerCase().includes(q) ||
      (tx.tanggal || '').includes(q)
    );
  }

  // Filter Owner Status
  if (currentOwnerFilter !== 'all') {
    list = list.filter(tx => tx.statusOwner === currentOwnerFilter);
  }

  tbody.innerHTML = '';
  if (tfoot) tfoot.innerHTML = '';

  if (list.length === 0) {
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }
  if (emptyNotice) emptyNotice.classList.add('hidden');

  const grandTotal = list.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  list.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-teal-50/40 transition border-b border-slate-100';

    const statusBadge = renderStatusOwnerBadge(item.statusOwner, item.id, 'restok');

    tr.innerHTML = `
      <td class="py-2.5 px-3 text-center text-slate-500 font-bold">${index + 1}</td>
      <td class="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800">
        <i class="fa-regular fa-calendar-check text-teal-600 mr-1"></i>${item.tanggal || '-'}
      </td>
      <td class="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
        ${item.supplier || '-'}
      </td>
      <td class="py-2.5 px-3">
        <div class="font-bold text-slate-800">${item.nama || '-'}</div>
        <div class="text-[11px] text-teal-700 flex items-center gap-1 mt-0.5">
          <span class="px-1.5 py-0.2 bg-teal-50 rounded text-[10px] font-semibold border border-teal-200">${item.kategori || 'Bahan'}</span>
          ${item.catatan ? `<span class="text-slate-400">•</span> <span class="text-slate-500 italic">${item.catatan}</span>` : ''}
        </div>
      </td>
      <td class="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
        ${item.nota ? `<span class="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-bold text-slate-700">${item.nota}</span>` : '<span class="text-slate-400 italic">-</span>'}
      </td>
      <td class="py-2.5 px-3 text-right font-black text-teal-900 whitespace-nowrap">
        ${formatRupiah(item.nominal)}
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap">
        ${statusBadge}
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap">
        <div class="inline-flex items-center gap-1">
          <button type="button" class="btn-edit-tx p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" data-id="${item.id}" title="Edit Data">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          <button type="button" class="btn-validate-dialog p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" data-id="${item.id}" data-type="restok" title="Validasi Owner">
            <i class="fa-solid fa-user-shield text-xs"></i>
          </button>
          <button type="button" class="btn-delete-tx p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" data-id="${item.id}" title="Hapus Data">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="5" class="py-2.5 px-3 text-right uppercase tracking-wider font-extrabold text-teal-950">
          TOTAL PENGELUARAN RESTOK BAHAN (${list.length} Transaksi):
        </td>
        <td class="py-2.5 px-3 text-right font-black text-teal-950 text-sm whitespace-nowrap border-l border-teal-200">
          ${formatRupiah(grandTotal)}
        </td>
        <td colspan="2" class="py-2.5 px-3 text-center text-[11px] text-teal-800 font-bold border-l border-teal-200">
          Mengurangi Saldo Bank Mandiri
        </td>
      </tr>
    `;
  }

  attachTableEvents(tbody);
}

// 2. Render Tabel Penarikan Lain
function renderPenarikanTable() {
  const tbody = document.getElementById('tableBodyPenarikan');
  const tfoot = document.getElementById('tableFootPenarikan');
  const emptyNotice = document.getElementById('emptyPenarikanNotice');
  if (!tbody) return;

  const allTxs = getBankTransactions();
  let list = allTxs.filter(tx => tx.type === 'penarikan');

  // Filter Period
  list = list.filter(tx => isDateInPeriod(tx.tanggal, currentPeriodFilter));

  // Filter Search
  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    list = list.filter(tx =>
      (tx.keterangan || '').toLowerCase().includes(q) ||
      (tx.penerima || '').toLowerCase().includes(q) ||
      (tx.kategori || '').toLowerCase().includes(q) ||
      (tx.tanggal || '').includes(q)
    );
  }

  // Filter Owner Status
  if (currentOwnerFilter !== 'all') {
    list = list.filter(tx => tx.statusOwner === currentOwnerFilter);
  }

  tbody.innerHTML = '';
  if (tfoot) tfoot.innerHTML = '';

  if (list.length === 0) {
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }
  if (emptyNotice) emptyNotice.classList.add('hidden');

  const grandTotal = list.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  list.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-rose-50/40 transition border-b border-slate-100';

    const statusBadge = renderStatusOwnerBadge(item.statusOwner, item.id, 'penarikan');

    tr.innerHTML = `
      <td class="py-2.5 px-3 text-center text-slate-500 font-bold">${index + 1}</td>
      <td class="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800">
        <i class="fa-regular fa-calendar-check text-rose-600 mr-1"></i>${item.tanggal || '-'}
      </td>
      <td class="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
        <span class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
          ${item.kategori || 'Penarikan'}
        </span>
      </td>
      <td class="py-2.5 px-3">
        <div class="font-bold text-slate-800">${item.keterangan || '-'}</div>
        ${item.catatan ? `<div class="text-[11px] text-slate-400 italic mt-0.5">${item.catatan}</div>` : ''}
      </td>
      <td class="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
        ${item.penerima || '<span class="text-slate-400 italic">-</span>'}
      </td>
      <td class="py-2.5 px-3 text-right font-black text-rose-900 whitespace-nowrap">
        ${formatRupiah(item.nominal)}
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap">
        ${statusBadge}
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap">
        <div class="inline-flex items-center gap-1">
          <button type="button" class="btn-edit-tx p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" data-id="${item.id}" title="Edit Data">
            <i class="fa-solid fa-pen-to-square text-xs"></i>
          </button>
          <button type="button" class="btn-validate-dialog p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" data-id="${item.id}" data-type="penarikan" title="Validasi Owner">
            <i class="fa-solid fa-user-shield text-xs"></i>
          </button>
          <button type="button" class="btn-delete-tx p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" data-id="${item.id}" title="Hapus Data">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="5" class="py-2.5 px-3 text-right uppercase tracking-wider font-extrabold text-rose-950">
          TOTAL PENARIKAN KEPERLUAN LAIN (${list.length} Penarikan):
        </td>
        <td class="py-2.5 px-3 text-right font-black text-rose-950 text-sm whitespace-nowrap border-l border-rose-200">
          ${formatRupiah(grandTotal)}
        </td>
        <td colspan="2" class="py-2.5 px-3 text-center text-[11px] text-rose-800 font-bold border-l border-rose-200">
          Mengurangi Saldo Bank Mandiri
        </td>
      </tr>
    `;
  }

  attachTableEvents(tbody);
}

// 3. Render Tabel Penerimaan Kasir (Transfer Mandiri + Card EDC)
function renderInflowTable() {
  const tbody = document.getElementById('tableBodyInflow');
  const tfoot = document.getElementById('tableFootInflow');
  const emptyNotice = document.getElementById('emptyInflowNotice');
  if (!tbody) return;

  const kasRecords = getKasRecords();
  let list = kasRecords.filter(rec => isDateInPeriod(rec.tanggal, currentPeriodFilter));

  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    list = list.filter(r =>
      (r.kasir || '').toLowerCase().includes(q) ||
      (r.tanggal || '').includes(q) ||
      (r.catatan || '').toLowerCase().includes(q)
    );
  }

  tbody.innerHTML = '';
  if (tfoot) tfoot.innerHTML = '';

  if (list.length === 0) {
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }
  if (emptyNotice) emptyNotice.classList.add('hidden');

  let totalTransfer = 0;
  let totalEdc = 0;
  let totalInflow = 0;

  list.forEach((r, index) => {
    const tf = Number(r.transferMandiri) || 0;
    const edc = Number(r.cardEdc) || 0;
    const subtotal = tf + edc;

    totalTransfer += tf;
    totalEdc += edc;
    totalInflow += subtotal;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-blue-50/40 transition border-b border-slate-100';

    tr.innerHTML = `
      <td class="py-2.5 px-3 text-center text-slate-500 font-bold">${index + 1}</td>
      <td class="py-2.5 px-3 whitespace-nowrap font-bold text-slate-800">
        <i class="fa-regular fa-calendar text-blue-600 mr-1"></i>${r.tanggal || '-'}
      </td>
      <td class="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
        ${r.kasir || 'Kasir'}
      </td>
      <td class="py-2.5 px-3 text-right font-bold text-blue-800 whitespace-nowrap">
        ${formatRupiah(tf)}
      </td>
      <td class="py-2.5 px-3 text-right font-bold text-indigo-800 whitespace-nowrap">
        ${formatRupiah(edc)}
      </td>
      <td class="py-2.5 px-3 text-right font-black text-blue-950 bg-blue-50/60 whitespace-nowrap">
        ${formatRupiah(subtotal)}
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <i class="fa-solid fa-check-double text-emerald-600"></i> Masuk Rekening
        </span>
      </td>
      <td class="py-2.5 px-3 text-center whitespace-nowrap">
        <a href="index.html" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition inline-flex items-center gap-1 border border-blue-200" title="Buka Detail di Kasir">
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Kasir
        </a>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="3" class="py-2.5 px-3 text-right uppercase tracking-wider font-extrabold text-blue-950">
          TOTAL PENERIMAAN NON-TUNAI (${list.length} Hari Transaksi):
        </td>
        <td class="py-2.5 px-3 text-right font-bold text-blue-900 border-l border-blue-200 whitespace-nowrap">
          ${formatRupiah(totalTransfer)}
        </td>
        <td class="py-2.5 px-3 text-right font-bold text-indigo-900 border-l border-blue-200 whitespace-nowrap">
          ${formatRupiah(totalEdc)}
        </td>
        <td class="py-2.5 px-3 text-right font-black text-blue-950 text-sm border-l border-blue-200 whitespace-nowrap bg-blue-100/90">
          ${formatRupiah(totalInflow)}
        </td>
        <td colspan="2" class="py-2.5 px-3 text-center text-[11px] text-blue-900 font-bold border-l border-blue-200">
          Menambah Saldo Bank Mandiri
        </td>
      </tr>
    `;
  }
}

// Attach common events to table buttons
function attachTableEvents(tbody) {
  tbody.querySelectorAll('.btn-quick-validate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      openValidationDialog(id, type);
    });
  });

  tbody.querySelectorAll('.btn-validate-dialog').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      openValidationDialog(id, type);
    });
  });

  tbody.querySelectorAll('.btn-edit-tx').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openEditModal(id);
    });
  });

  tbody.querySelectorAll('.btn-delete-tx').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      deleteTransaction(id);
    });
  });
}

function renderAllViews() {
  recalculateBankLedger();
  renderRestokTable();
  renderPenarikanTable();
  renderInflowTable();
}

// -------------------------------------------------------------
// CRUD: RESTOK BAHAN & PENARIKAN LAIN
// -------------------------------------------------------------

function openAddRestokModal() {
  document.getElementById('inputRestokId').value = '';
  document.getElementById('modalRestokTitle').innerText = 'Catat Pembelian / Restok Bahan';
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('inputRestokTanggal').value = today;
  document.getElementById('inputRestokSupplier').value = '';
  document.getElementById('inputRestokKategori').value = 'Aki & Baterai';
  document.getElementById('inputRestokNota').value = '';
  document.getElementById('inputRestokNama').value = '';
  document.getElementById('inputRestokNominal').value = '0';
  document.getElementById('inputRestokStatusOwner').value = 'pending';

  document.getElementById('modalRestok').classList.remove('hidden');
}

function openAddPenarikanModal() {
  document.getElementById('inputPenarikanId').value = '';
  document.getElementById('modalPenarikanTitle').innerText = 'Catat Penarikan Keperluan Lain';
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('inputPenarikanTanggal').value = today;
  document.getElementById('inputPenarikanKategori').value = 'Prive / Bagi Hasil Owner';
  document.getElementById('inputPenarikanKeterangan').value = '';
  document.getElementById('inputPenarikanPenerima').value = '';
  document.getElementById('inputPenarikanNominal').value = '0';
  document.getElementById('inputPenarikanStatusOwner').value = 'pending';

  document.getElementById('modalPenarikan').classList.remove('hidden');
}

function openEditModal(id) {
  const allTxs = getBankTransactions();
  const item = allTxs.find(tx => tx.id === id);
  if (!item) return;

  if (item.type === 'restok') {
    document.getElementById('inputRestokId').value = item.id;
    document.getElementById('modalRestokTitle').innerText = 'Edit Pembelian / Restok Bahan';
    document.getElementById('inputRestokTanggal').value = item.tanggal || '';
    document.getElementById('inputRestokSupplier').value = item.supplier || '';
    document.getElementById('inputRestokKategori').value = item.kategori || 'Aki & Baterai';
    document.getElementById('inputRestokNota').value = item.nota || '';
    document.getElementById('inputRestokNama').value = item.nama || '';
    document.getElementById('inputRestokNominal').value = Number(item.nominal || 0).toLocaleString('id-ID');
    document.getElementById('inputRestokStatusOwner').value = item.statusOwner || 'pending';

    document.getElementById('modalRestok').classList.remove('hidden');
  } else if (item.type === 'penarikan') {
    document.getElementById('inputPenarikanId').value = item.id;
    document.getElementById('modalPenarikanTitle').innerText = 'Edit Penarikan Keperluan Lain';
    document.getElementById('inputPenarikanTanggal').value = item.tanggal || '';
    document.getElementById('inputPenarikanKategori').value = item.kategori || 'Prive / Bagi Hasil Owner';
    document.getElementById('inputPenarikanKeterangan').value = item.keterangan || '';
    document.getElementById('inputPenarikanPenerima').value = item.penerima || '';
    document.getElementById('inputPenarikanNominal').value = Number(item.nominal || 0).toLocaleString('id-ID');
    document.getElementById('inputPenarikanStatusOwner').value = item.statusOwner || 'pending';

    document.getElementById('modalPenarikan').classList.remove('hidden');
  }
}

function deleteTransaction(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data transaksi ini dari rekening bank?')) return;
  let allTxs = getBankTransactions();
  allTxs = allTxs.filter(tx => tx.id !== id);
  saveBankTransactions(allTxs);
  renderAllViews();
  showBankToast('Transaksi berhasil dihapus dari rekening.', 'warning');
}

// -------------------------------------------------------------
// OWNER VALIDATION DIALOG & ACTIONS
// -------------------------------------------------------------

function openValidationDialog(id, type) {
  const allTxs = getBankTransactions();
  const item = allTxs.find(tx => tx.id === id);
  if (!item) return;

  document.getElementById('validateItemId').value = item.id;
  document.getElementById('validateItemType').value = type;
  
  const title = item.type === 'restok' ? `Restok: ${item.supplier} - ${item.nama}` : `Penarikan: ${item.kategori} - ${item.keterangan}`;
  document.getElementById('validateItemDesc').innerText = title;
  document.getElementById('validateItemAmount').innerText = formatRupiah(item.nominal);
  document.getElementById('validateItemDate').innerText = `Tanggal: ${item.tanggal || '-'} | Status Saat Ini: ${item.statusOwner || 'pending'}`;
  document.getElementById('validateOwnerNote').value = item.ownerNote || '';

  document.getElementById('modalOwnerValidation').classList.remove('hidden');
}

function processOwnerValidation(newStatus) {
  const id = document.getElementById('validateItemId').value;
  const note = document.getElementById('validateOwnerNote').value.trim();
  const settings = getBankSettings();

  const allTxs = getBankTransactions();
  const idx = allTxs.findIndex(tx => tx.id === id);
  if (idx !== -1) {
    allTxs[idx].statusOwner = newStatus;
    allTxs[idx].ownerNote = note;
    allTxs[idx].validatedAt = new Date().toISOString();
    allTxs[idx].validatedBy = settings.ownerName || 'Owner';
    saveBankTransactions(allTxs);
    renderAllViews();
    showBankToast(`Validasi berhasil: ${newStatus === 'approved' ? 'Disetujui Owner' : 'Ditolak'}!`, 'success');
  }

  document.getElementById('modalOwnerValidation').classList.add('hidden');
}

// -------------------------------------------------------------
// TAB SWITCHER
// -------------------------------------------------------------

function switchTab(tabKey) {
  activeTab = tabKey;
  const tabs = [
    { key: 'restok', btn: 'tabBtnRestok', content: 'tabContentRestok', activeColor: 'border-teal-600 text-teal-900' },
    { key: 'penarikan', btn: 'tabBtnPenarikan', content: 'tabContentPenarikan', activeColor: 'border-rose-600 text-rose-900' },
    { key: 'inflow', btn: 'tabBtnInflow', content: 'tabContentInflow', activeColor: 'border-blue-600 text-blue-900' }
  ];

  tabs.forEach(t => {
    const btn = document.getElementById(t.btn);
    const content = document.getElementById(t.content);

    if (t.key === tabKey) {
      btn?.classList.remove('border-transparent', 'text-slate-500');
      btn?.classList.add(...t.activeColor.split(' '), 'font-extrabold');
      content?.classList.remove('hidden');
    } else {
      btn?.classList.remove('border-teal-600', 'text-teal-900', 'border-rose-600', 'text-rose-900', 'border-blue-600', 'text-blue-900', 'font-extrabold');
      btn?.classList.add('border-transparent', 'text-slate-500', 'font-bold');
      content?.classList.add('hidden');
    }
  });
}

// -------------------------------------------------------------
// POPULATE PRINT / PDF CONTAINER (A4 FORMAT)
// -------------------------------------------------------------

function populateBankPrintContainer() {
  const summary = recalculateBankLedger();
  const settings = summary.settings;

  document.getElementById('printBankInfo').innerText = `Rekening: ${settings.accountName || 'Bank Mandiri'} • Dicetak pada: ${new Date().toLocaleString('id-ID')}`;
  document.getElementById('printPeriodeLabel').innerText = `Filter Periode: ${currentPeriodFilter === 'all' ? 'Semua Data' : (currentPeriodFilter === 'this_month' ? 'Bulan Ini' : 'Hari Ini')}`;
  document.getElementById('printSignOwner').innerText = `( ${settings.ownerName || 'Pemilik / Owner'} )`;

  document.getElementById('printSaldoAwal').innerText = formatRupiah(summary.saldoAwal);
  document.getElementById('printTotalInflow').innerText = `+${formatRupiah(summary.totalInflowKasir)}`;
  document.getElementById('printTotalOutflow').innerText = `-${formatRupiah(summary.totalOutflowBank)}`;
  document.getElementById('printPerkiraanSaldo').innerText = formatRupiah(summary.perkiraanSaldoBank);

  document.getElementById('printSubtotalRestok').innerText = formatRupiah(summary.totalRestokBahan);
  document.getElementById('printSubtotalPenarikan').innerText = formatRupiah(summary.totalPenarikanLain);

  // Table Restok
  const tbodyRestok = document.getElementById('printTableRestokBody');
  if (tbodyRestok) {
    if (summary.restokList.length === 0) {
      tbodyRestok.innerHTML = '<tr><td colspan="6" class="p-2 text-center text-slate-400 italic">Tidak ada pengeluaran restok bahan pada periode ini</td></tr>';
    } else {
      tbodyRestok.innerHTML = summary.restokList.map((item, idx) => `
        <tr class="border-b border-slate-200">
          <td class="p-1.5 text-center">${idx + 1}</td>
          <td class="p-1.5 font-bold">${item.tanggal || '-'}</td>
          <td class="p-1.5">${item.supplier || '-'} ${item.nota ? `(${item.nota})` : ''}</td>
          <td class="p-1.5">${item.nama || '-'} (${item.kategori || 'Bahan'})</td>
          <td class="p-1.5 text-right font-bold text-teal-900">${formatRupiah(item.nominal)}</td>
          <td class="p-1.5 text-center font-bold">${item.statusOwner === 'approved' ? '✅ Disetujui' : (item.statusOwner === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu')}</td>
        </tr>
      `).join('');
    }
  }

  // Table Penarikan
  const tbodyPenarikan = document.getElementById('printTablePenarikanBody');
  if (tbodyPenarikan) {
    if (summary.penarikanList.length === 0) {
      tbodyPenarikan.innerHTML = '<tr><td colspan="6" class="p-2 text-center text-slate-400 italic">Tidak ada penarikan keperluan lain pada periode ini</td></tr>';
    } else {
      tbodyPenarikan.innerHTML = summary.penarikanList.map((item, idx) => `
        <tr class="border-b border-slate-200">
          <td class="p-1.5 text-center">${idx + 1}</td>
          <td class="p-1.5 font-bold">${item.tanggal || '-'}</td>
          <td class="p-1.5">${item.kategori || '-'}: ${item.keterangan || '-'}</td>
          <td class="p-1.5">${item.penerima || '-'}</td>
          <td class="p-1.5 text-right font-bold text-rose-900">${formatRupiah(item.nominal)}</td>
          <td class="p-1.5 text-center font-bold">${item.statusOwner === 'approved' ? '✅ Disetujui' : (item.statusOwner === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu')}</td>
        </tr>
      `).join('');
    }
  }

  return summary;
}

// Download PDF
function downloadBankReportAsPdf() {
  populateBankPrintContainer();
  const element = document.getElementById('pdfBankExportContainer');
  const printArea = document.getElementById('printBankArea');
  printArea.classList.remove('hidden');

  const filename = `Laporan_Rekening_Mandiri_Restok_${new Date().toISOString().slice(0, 10)}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save().then(() => {
      printArea.classList.add('hidden');
    }).catch(err => {
      console.error('PDF error:', err);
      printArea.classList.add('hidden');
      alert('Terjadi kesalahan membuat PDF: ' + err.message);
    });
  } else {
    printArea.classList.add('hidden');
    window.print();
  }
}

// Export to Excel CSV
function exportBankToExcelCSV() {
  const allTxs = getBankTransactions();
  const kasRecords = getKasRecords();
  const settings = getBankSettings();

  const headers = [
    'Tipe Transaksi',
    'Tanggal Pembayaran / Transaksi',
    'Kategori / Supplier',
    'Keterangan / Rincian Bahan',
    'No Nota / Kasir',
    'Pemasukan Non-Tunai (+)',
    'Pengeluaran Restok (-)',
    'Penarikan Keperluan Lain (-)',
    'Status Validasi Owner',
    'Catatan Validasi'
  ];

  const rows = [];

  // 1. Inflow dari Kasir
  kasRecords.forEach(r => {
    const totalTfEdc = (Number(r.transferMandiri) || 0) + (Number(r.cardEdc) || 0);
    rows.push([
      `"Penerimaan Non-Tunai Kasir"`,
      `"${r.tanggal}"`,
      `"Transfer Mandiri + Card EDC"`,
      `"Omset kasir Shop & Drive & Bima Motor"`,
      `"${(r.kasir || 'Kasir').replace(/"/g, '""')}"`,
      totalTfEdc,
      0,
      0,
      `"Auto-Masuk Rekening"`,
      `"TF Mandiri: Rp ${r.transferMandiri || 0}, EDC: Rp ${r.cardEdc || 0}"`
    ].join(';'));
  });

  // 2. Restok Bahan & Penarikan
  allTxs.forEach(tx => {
    const isRestok = tx.type === 'restok';
    const statusText = tx.statusOwner === 'approved' ? 'Disetujui Owner' : (tx.statusOwner === 'rejected' ? 'Ditolak' : 'Menunggu Validasi');
    rows.push([
      `"${isRestok ? 'Pengeluaran Restok Bahan' : 'Penarikan Keperluan Lain'}"`,
      `"${tx.tanggal}"`,
      `"${(isRestok ? tx.supplier : tx.kategori || '').replace(/"/g, '""')}"`,
      `"${(isRestok ? tx.nama : tx.keterangan || '').replace(/"/g, '""')}"`,
      `"${(isRestok ? tx.nota || '-' : tx.penerima || '-').replace(/"/g, '""')}"`,
      0,
      isRestok ? (tx.nominal || 0) : 0,
      !isRestok ? (tx.nominal || 0) : 0,
      `"${statusText}"`,
      `"${(tx.ownerNote || tx.catatan || '').replace(/"/g, '""')}"`
    ].join(';'));
  });

  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Rekening_Bank_Mandiri_Restok_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// OWNER SECURITY PIN VERIFICATION (PIN: 2209)
// -------------------------------------------------------------
const OWNER_SECURITY_PIN = '2209';
const OWNER_AUTH_SESSION_KEY = 'owner_pin_auth_session';

function setupOwnerSecurityGate() {
  const overlay = document.getElementById('bankSecurityOverlay');
  const form = document.getElementById('directPinForm');
  const inputPin = document.getElementById('inputDirectPin');
  const errEl = document.getElementById('directPinError');
  const keyBtns = document.querySelectorAll('.direct-pin-key-btn');
  const btnClear = document.getElementById('btnDirectPinClear');
  const btnBackspace = document.getElementById('btnDirectPinBackspace');
  const btnLock = document.getElementById('btnLockOwnerSession');

  // Lock / Logout session button in header
  btnLock?.addEventListener('click', () => {
    if (confirm('Kunci akses Owner dan kembali ke Beranda Kas Kecil?')) {
      sessionStorage.removeItem(OWNER_AUTH_SESSION_KEY);
      window.location.href = 'index.html';
    }
  });

  // Kunci sesi otomatis saat navigasi kembali ke halaman Kas Kecil
  document.querySelectorAll('a[href="index.html"]').forEach(link => {
    link.addEventListener('click', () => {
      sessionStorage.removeItem(OWNER_AUTH_SESSION_KEY);
    });
  });

  // Check current session
  const isAuth = sessionStorage.getItem(OWNER_AUTH_SESSION_KEY) === OWNER_SECURITY_PIN;

  if (!isAuth) {
    if (overlay) {
      overlay.classList.remove('hidden');
      setTimeout(() => inputPin?.focus(), 150);
    }
  } else {
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  function handleVerifyDirectPin(e) {
    if (e) e.preventDefault();
    if (!inputPin) return;
    const pin = (inputPin.value || '').trim();
    if (pin === OWNER_SECURITY_PIN) {
      sessionStorage.setItem(OWNER_AUTH_SESSION_KEY, OWNER_SECURITY_PIN);
      overlay?.classList.add('hidden');
      if (errEl) errEl.classList.add('hidden');
      inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    } else {
      if (errEl) {
        errEl.classList.remove('hidden');
        inputPin.classList.add('border-rose-500', 'bg-rose-50/50');
      }
      inputPin.value = '';
      inputPin.focus();
    }
  }

  keyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!inputPin) return;
      if (errEl) errEl.classList.add('hidden');
      inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
      if (inputPin.value.length < 4) {
        inputPin.value += btn.getAttribute('data-val');
        if (inputPin.value.length === 4) {
          handleVerifyDirectPin();
        }
      }
    });
  });

  btnClear?.addEventListener('click', () => {
    if (!inputPin) return;
    inputPin.value = '';
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    inputPin.focus();
  });

  btnBackspace?.addEventListener('click', () => {
    if (!inputPin) return;
    inputPin.value = inputPin.value.slice(0, -1);
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    inputPin.focus();
  });

  inputPin?.addEventListener('input', () => {
    inputPin.value = inputPin.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    if (inputPin.value.length === 4) {
      handleVerifyDirectPin();
    }
  });

  form?.addEventListener('submit', handleVerifyDirectPin);
}

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi otomatis data ke local storage jika masih kosong
  initBankDataIfEmpty();

  // Check Owner Security Gate first
  setupOwnerSecurityGate();

  // Setup Number Inputs
  setupNumberInput(document.getElementById('inputRestokNominal'));
  setupNumberInput(document.getElementById('inputPenarikanNominal'));
  setupNumberInput(document.getElementById('settingBankSaldoAwal'));

  // Tab Main Switchers
  document.getElementById('tabBtnRestok')?.addEventListener('click', () => switchTab('restok'));
  document.getElementById('tabBtnPenarikan')?.addEventListener('click', () => switchTab('penarikan'));
  document.getElementById('tabBtnInflow')?.addEventListener('click', () => switchTab('inflow'));

  // Period Filter Buttons
  document.querySelectorAll('.btn-filter-period').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-filter-period').forEach(b => {
        b.classList.remove('bg-white', 'text-blue-900', 'shadow-sm');
        b.classList.add('text-slate-600');
      });
      btn.classList.add('bg-white', 'text-blue-900', 'shadow-sm');
      btn.classList.remove('text-slate-600');

      currentPeriodFilter = btn.dataset.period;
      renderAllViews();
    });
  });

  // Search & Status Filters
  document.getElementById('filterBankSearch')?.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    renderAllViews();
  });

  document.getElementById('filterOwnerValidation')?.addEventListener('change', (e) => {
    currentOwnerFilter = e.target.value;
    renderAllViews();
  });

  // Buttons to open Modals
  document.getElementById('btnOpenRestokModal')?.addEventListener('click', openAddRestokModal);
  document.getElementById('btnTambahRestokInline')?.addEventListener('click', openAddRestokModal);
  document.getElementById('btnTambahRestokEmpty')?.addEventListener('click', openAddRestokModal);

  document.getElementById('btnOpenPenarikanModal')?.addEventListener('click', openAddPenarikanModal);
  document.getElementById('btnTambahPenarikanInline')?.addEventListener('click', openAddPenarikanModal);
  document.getElementById('btnTambahPenarikanEmpty')?.addEventListener('click', openAddPenarikanModal);

  // Settings Modal
  document.getElementById('btnOpenBankSettings')?.addEventListener('click', () => {
    const settings = getBankSettings();
    document.getElementById('settingBankSaldoAwal').value = Number(settings.saldoAwal || 0).toLocaleString('id-ID');
    document.getElementById('settingBankAccountName').value = settings.accountName || '';
    document.getElementById('settingBankOwnerName').value = settings.ownerName || '';
    document.getElementById('modalBankSettings').classList.remove('hidden');
  });

  document.getElementById('btnSaveBankSettings')?.addEventListener('click', () => {
    const saldoAwal = parseNumber(document.getElementById('settingBankSaldoAwal')?.value || 0);
    const accountName = document.getElementById('settingBankAccountName')?.value.trim() || 'Bank Mandiri - 1560023250204';
    const ownerName = document.getElementById('settingBankOwnerName')?.value.trim() || 'PT DUTARAYA BERJAYA';

    saveBankSettings({ saldoAwal, saldoBulanLalu: saldoAwal, accountName, ownerName });
    document.getElementById('modalBankSettings').classList.add('hidden');
    renderAllViews();
    showBankToast('Pengaturan saldo acuan & rekening berhasil disimpan!', 'success');
  });

  // Close modals buttons
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.modal;
      if (modalId) document.getElementById(modalId)?.classList.add('hidden');
    });
  });

  // Form Submit: Restok Bahan
  document.getElementById('formRestok')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('inputRestokId').value || 'RESTOK-' + Date.now();
    const tanggal = document.getElementById('inputRestokTanggal').value;
    const supplier = document.getElementById('inputRestokSupplier').value.trim();
    const kategori = document.getElementById('inputRestokKategori').value;
    const nota = document.getElementById('inputRestokNota').value.trim();
    const nama = document.getElementById('inputRestokNama').value.trim();
    const nominal = parseNumber(document.getElementById('inputRestokNominal').value);
    const statusOwner = document.getElementById('inputRestokStatusOwner').value;

    if (!tanggal || nominal <= 0) {
      showBankToast('Mohon lengkapi tanggal dan nominal pembayaran restok bahan.', 'warning');
      return;
    }

    const allTxs = getBankTransactions();
    const existingIdx = allTxs.findIndex(tx => tx.id === id);

    const record = {
      id,
      type: 'restok',
      tanggal,
      supplier,
      kategori,
      nota,
      nama,
      nominal,
      statusOwner,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      record.createdAt = allTxs[existingIdx].createdAt;
      allTxs[existingIdx] = record;
    } else {
      record.createdAt = new Date().toISOString();
      allTxs.unshift(record);
    }

    saveBankTransactions(allTxs);
    document.getElementById('modalRestok').classList.add('hidden');
    renderAllViews();
    showBankToast(`Transaksi Restok Bahan berhasil ${existingIdx !== -1 ? 'diperbarui' : 'dicatat'}!`, 'success');
  });

  // Form Submit: Penarikan Lain
  document.getElementById('formPenarikan')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('inputPenarikanId').value || 'TARIK-' + Date.now();
    const tanggal = document.getElementById('inputPenarikanTanggal').value;
    const kategori = document.getElementById('inputPenarikanKategori').value;
    const keterangan = document.getElementById('inputPenarikanKeterangan').value.trim();
    const penerima = document.getElementById('inputPenarikanPenerima').value.trim();
    const nominal = parseNumber(document.getElementById('inputPenarikanNominal').value);
    const statusOwner = document.getElementById('inputPenarikanStatusOwner').value;

    if (!tanggal || nominal <= 0) {
      showBankToast('Mohon lengkapi tanggal dan nominal penarikan.', 'warning');
      return;
    }

    const allTxs = getBankTransactions();
    const existingIdx = allTxs.findIndex(tx => tx.id === id);

    const record = {
      id,
      type: 'penarikan',
      tanggal,
      kategori,
      keterangan,
      penerima,
      nominal,
      statusOwner,
      updatedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      record.createdAt = allTxs[existingIdx].createdAt;
      allTxs[existingIdx] = record;
    } else {
      record.createdAt = new Date().toISOString();
      allTxs.unshift(record);
    }

    saveBankTransactions(allTxs);
    document.getElementById('modalPenarikan').classList.add('hidden');
    renderAllViews();
    showBankToast(`Transaksi Penarikan Lain berhasil ${existingIdx !== -1 ? 'diperbarui' : 'dicatat'}!`, 'success');
  });

  // Owner Validation Modal Action Buttons
  document.getElementById('btnApproveByOwner')?.addEventListener('click', () => processOwnerValidation('approved'));
  document.getElementById('btnRejectByOwner')?.addEventListener('click', () => processOwnerValidation('rejected'));

  // Sync from Kasir button
  document.getElementById('btnSyncFromKasir')?.addEventListener('click', syncFromKasirAndDatabase);

  // PDF & Excel Buttons
  document.getElementById('btnDownloadBankPdf')?.addEventListener('click', downloadBankReportAsPdf);
  document.getElementById('btnExportBankExcel')?.addEventListener('click', exportBankToExcelCSV);

  // Initial render
  renderAllViews();
});
