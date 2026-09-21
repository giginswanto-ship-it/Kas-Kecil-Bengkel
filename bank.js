/**
 * MONITORING REKENING BANK MANDIRI & RESTOK BAHAN
 * Logic for Bank Mandiri Ledger, Material Restock (Pembelian Bahan),
 * Non-Cash Kasir Inflow Sync (Transfer Mandiri + Card EDC),
 * Other Withdrawals, Owner Validation, Realtime Balance Estimates,
 * and Export to PDF / Excel CSV.
 */

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
// STORAGE & DATA ACCESS HELPERS
// -------------------------------------------------------------

function getBankSettings() {
  try {
    const raw = localStorage.getItem(BANK_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {
      saldoAwal: 0,
      accountName: 'Bank Mandiri - 13700xxxxxxxx',
      ownerName: 'Bapak Owner / Pimpinan',
      bengkelName: 'Shop & Drive & Bima Motor'
    };
  } catch (e) {
    return {
      saldoAwal: 0,
      accountName: 'Bank Mandiri - 13700xxxxxxxx',
      ownerName: 'Bapak Owner / Pimpinan',
      bengkelName: 'Shop & Drive & Bima Motor'
    };
  }
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
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading bank transactions:', e);
    return [];
  }
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
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading kas records:', e);
    return [];
  }
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
// INITIALIZATION
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
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
    const accountName = document.getElementById('settingBankAccountName')?.value.trim() || 'Bank Mandiri - 13700xxxxxxxx';
    const ownerName = document.getElementById('settingBankOwnerName')?.value.trim() || 'Owner';

    saveBankSettings({ saldoAwal, accountName, ownerName });
    alert('Pengaturan rekening & owner berhasil disimpan!');
    document.getElementById('modalBankSettings').classList.add('hidden');
    renderAllViews();
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
      alert('Mohon lengkapi tanggal dan nominal pembayaran.');
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
      alert('Mohon lengkapi tanggal dan nominal penarikan.');
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
  });

  // Owner Validation Modal Action Buttons
  document.getElementById('btnApproveByOwner')?.addEventListener('click', () => processOwnerValidation('approved'));
  document.getElementById('btnRejectByOwner')?.addEventListener('click', () => processOwnerValidation('rejected'));

  // Sync from Kasir button
  document.getElementById('btnSyncFromKasir')?.addEventListener('click', () => {
    renderAllViews();
    alert('Data penerimaan kasir berhasil disinkronkan!');
  });

  // PDF & Excel Buttons
  document.getElementById('btnDownloadBankPdf')?.addEventListener('click', downloadBankReportAsPdf);
  document.getElementById('btnExportBankExcel')?.addEventListener('click', exportBankToExcelCSV);

  // Initial render
  renderAllViews();
});
