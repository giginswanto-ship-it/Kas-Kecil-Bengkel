/**
 * MONITOR KAS KECIL BENGKEL (Shop & Drive & Bima Motor)
 * Database Layer (IndexedDB + LocalStorage Sync),
 * Live Reactive Calculations, Daily Calendar, Denomination Counter,
 * Direct PDF Download (html2pdf), Excel Export, and Print Sheet.
 */

// Database Constants
const DB_NAME = 'KasBengkelShopDriveDB';
const DB_VERSION = 1;
const STORAGE_KEY = 'kas_bengkel_shop_drive_bima_v1';

let dbInstance = null;
let currentExpenses = [];

let currentCalDate = new Date();

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

// Utility: Number input formatter
function setupNumberInput(inputEl) {
  inputEl.addEventListener('focus', function () {
    const rawVal = parseNumber(this.value);
    this.value = rawVal === 0 ? '' : rawVal;
  });

  inputEl.addEventListener('input', function () {
    const rawVal = parseNumber(this.value);
    if (this.value !== '') {
      this.value = rawVal.toLocaleString('id-ID');
    }
    recalculateAll();
  });

  inputEl.addEventListener('blur', function () {
    const rawVal = parseNumber(this.value);
    this.value = rawVal.toLocaleString('id-ID');
    recalculateAll();
  });
}

// Initialize live date and clock
function initLiveClock() {
  const dateEl = document.getElementById('liveClock');
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  if (dateEl) {
    dateEl.innerText = now.toLocaleDateString('id-ID', options);
  }

  const inputTanggal = document.getElementById('inputTanggal');
  if (inputTanggal && !inputTanggal.value) {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    inputTanggal.value = `${yyyy}-${mm}-${dd}`;
  }
}

// -------------------------------------------------------------
// INDEXEDDB DATABASE ENGINE
// -------------------------------------------------------------
function openDatabase() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to LocalStorage.');
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('kas_records')) {
        const store = db.createObjectStore('kas_records', { keyPath: 'id' });
        store.createIndex('tanggal', 'tanggal', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      console.log('IndexedDB KasBengkelShopDriveDB connected successfully.');
      syncIndexedDBWithStorage();
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.error('IndexedDB error:', e.target.error);
      resolve(null);
    };
  });
}

function syncIndexedDBWithStorage() {
  if (!dbInstance) return;
  const records = getSavedRecordsFromLocalStorage();
  const tx = dbInstance.transaction('kas_records', 'readwrite');
  const store = tx.objectStore('kas_records');
  records.forEach(rec => store.put(rec));
}

// LocalStorage Helper
function getSavedRecordsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return [];
  }
}

function getSavedRecords() {
  return getSavedRecordsFromLocalStorage();
}

function saveRecordsToStorage(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    if (dbInstance) {
      const tx = dbInstance.transaction('kas_records', 'readwrite');
      const store = tx.objectStore('kas_records');
      store.clear().onsuccess = () => {
        records.forEach(rec => store.put(rec));
      };
    }
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
}

// Dynamic Expenses Renderer
function renderExpenses() {
  const container = document.getElementById('expenseList');
  if (!container) return;

  container.innerHTML = '';

  if (currentExpenses.length === 0) {
    container.innerHTML = `
      <div class="text-center py-3 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Belum ada biaya pengeluaran operasional. Klik tombol di bawah untuk menambah.
      </div>
    `;
    return;
  }

  currentExpenses.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 bg-slate-50/70 p-2 rounded-xl border border-rose-100 shadow-sm';
    row.innerHTML = `
      <div class="flex-1">
        <input type="text" value="${item.desc || ''}" placeholder="Keterangan pengeluaran (misal: Bensin, Makan, dsb)..." 
          data-id="${item.id}" class="expense-desc-input w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-rose-500 outline-none">
      </div>
      <div class="w-36 sm:w-44 relative">
        <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] font-bold text-slate-400">Rp</span>
        <input type="text" value="${Number(item.amount || 0).toLocaleString('id-ID')}" placeholder="0" 
          data-id="${item.id}" class="expense-amount-input number-input w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-bold text-rose-700 focus:ring-1 focus:ring-rose-500 outline-none text-right">
      </div>
      <button type="button" class="btn-delete-expense text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition" data-id="${item.id}" title="Hapus Pengeluaran">
        <i class="fa-solid fa-trash-can text-xs"></i>
      </button>
    `;
    container.appendChild(row);
  });

  // Attach input event listeners
  container.querySelectorAll('.expense-desc-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const item = currentExpenses.find(x => x.id === id);
      if (item) item.desc = e.target.value;
    });
  });

  container.querySelectorAll('.expense-amount-input').forEach(input => {
    setupNumberInput(input);
    input.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const item = currentExpenses.find(x => x.id === id);
      if (item) item.amount = parseNumber(e.target.value);
      recalculateAll();
    });
    input.addEventListener('blur', (e) => {
      const id = Number(e.target.dataset.id);
      const item = currentExpenses.find(x => x.id === id);
      if (item) item.amount = parseNumber(e.target.value);
      recalculateAll();
    });
  });

  container.querySelectorAll('.btn-delete-expense').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      currentExpenses = currentExpenses.filter(x => x.id !== id);
      renderExpenses();
      recalculateAll();
    });
  });
}

// Add Expense Item
function addExpenseItem() {
  const newId = Date.now();
  currentExpenses.push({
    id: newId,
    desc: '',
    amount: 0
  });
  renderExpenses();
  recalculateAll();

  setTimeout(() => {
    const inputs = document.querySelectorAll('.expense-desc-input');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  }, 50);
}

// Recalculate Cash Balances according to formulas
function recalculateAll() {
  const saldoAwal = parseNumber(document.getElementById('inputSaldoAwal')?.value || 0);

  // 1. PEMASUKAN = Penjualan Shop & Drive + Penjualan Bima Motor + Sumber Pemasukan Lain
  const penjualanShopDrive = parseNumber(document.getElementById('inputPenjualanShopDrive')?.value || 0);
  const penjualanBimaMotor = parseNumber(document.getElementById('inputPenjualanBimaMotor')?.value || 0);
  const pemasukanLain = parseNumber(document.getElementById('inputPemasukanLain')?.value || 0);
  const keteranganPemasukanLain = document.getElementById('inputKeteranganPemasukanLain')?.value || '';
  const totalPemasukan = penjualanShopDrive + penjualanBimaMotor + pemasukanLain;

  // 2. PENGELUARAN KAS = Transfer Bank Mandiri + Card/EDC + Penghematan/Trade In + Pengeluaran Biaya Operasional
  const transferMandiri = parseNumber(document.getElementById('inputTransferMandiri')?.value || 0);
  const cardEdc = parseNumber(document.getElementById('inputCardEdc')?.value || 0);
  const penghematanTradeIn = parseNumber(document.getElementById('inputPenghematanTradeIn')?.value || 0);
  
  // Dynamic expenses sum
  const biayaOperasional = currentExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalPengeluaranKas = transferMandiri + cardEdc + penghematanTradeIn + biayaOperasional;

  // 3. SISA UANG TUNAI DI KAS KECIL
  // Rumus: [Saldo Awal + Total Pemasukan] - Total Pengeluaran Kas
  const sisaUangKasKecil = (saldoAwal + totalPemasukan) - totalPengeluaranKas;

  // 4. OPNAME KAS FISIK DI LACI
  const fisikRiil = parseNumber(document.getElementById('inputFisikRiil')?.value || 0);
  const selisih = fisikRiil - sisaUangKasKecil;

  // Update Top Metric Cards
  document.getElementById('cardTotalPemasukan').innerText = formatRupiah(totalPemasukan);
  document.getElementById('cardPenjualanShopDrive').innerText = formatRupiah(penjualanShopDrive);
  document.getElementById('cardPenjualanBimaMotor').innerText = formatRupiah(penjualanBimaMotor);
  document.getElementById('cardTotalPengeluaran').innerText = formatRupiah(totalPengeluaranKas);
  document.getElementById('cardSisaKasKecil').innerText = formatRupiah(sisaUangKasKecil);

  // Update Form Section Badges
  document.getElementById('badgeSubtotalPemasukan').innerText = `Total Pemasukan: ${formatRupiah(totalPemasukan)}`;
  document.getElementById('badgeSubtotalPengeluaran').innerText = `Total Pengeluaran: ${formatRupiah(totalPengeluaranKas)}`;
  document.getElementById('badgeTotalBiayaOperasional').innerText = formatRupiah(biayaOperasional);

  // Update Breakdown (Right Column)
  document.getElementById('calcSaldoAwal').innerText = formatRupiah(saldoAwal);
  document.getElementById('calcTotalPemasukan').innerText = formatRupiah(totalPemasukan);
  document.getElementById('calcShopDrive').innerText = formatRupiah(penjualanShopDrive);
  document.getElementById('calcBimaMotor').innerText = formatRupiah(penjualanBimaMotor);
  const calcPemasukanLainEl = document.getElementById('calcPemasukanLain');
  if (calcPemasukanLainEl) calcPemasukanLainEl.innerText = formatRupiah(pemasukanLain);

  document.getElementById('calcTotalPengeluaran').innerText = `(${formatRupiah(totalPengeluaranKas)})`;
  document.getElementById('calcMinusMandiri').innerText = `(${formatRupiah(transferMandiri)})`;
  document.getElementById('calcMinusEdc').innerText = `(${formatRupiah(cardEdc)})`;
  document.getElementById('calcMinusTradeIn').innerText = `(${formatRupiah(penghematanTradeIn)})`;
  document.getElementById('calcMinusBiayaOps').innerText = `(${formatRupiah(biayaOperasional)})`;

  document.getElementById('calcSisaKasHasil').innerText = formatRupiah(sisaUangKasKecil);
  document.getElementById('calcFisikDisplay').innerText = formatRupiah(fisikRiil);

  // Status Selisih Indicator
  const diffBadge = document.getElementById('diffBadge');
  const selisihDisplay = document.getElementById('calcSelisihDisplay');

  if (selisih === 0) {
    diffBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shadow-sm';
    diffBadge.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Status: Sesuai (Pas)';
    selisihDisplay.className = 'font-bold text-emerald-700';
    selisihDisplay.innerText = 'Selisih: Rp 0 (PAS)';
  } else if (selisih > 0) {
    diffBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 shadow-sm';
    diffBadge.innerHTML = `<i class="fa-solid fa-arrow-trend-up mr-1"></i> Status: Kas Lebih (+${formatRupiah(selisih)})`;
    selisihDisplay.className = 'font-bold text-amber-700';
    selisihDisplay.innerText = `Lebih: +${formatRupiah(selisih)}`;
  } else {
    diffBadge.className = 'text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 shadow-sm';
    diffBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Status: Kas Kurang (${formatRupiah(selisih)})`;
    selisihDisplay.className = 'font-bold text-rose-700';
    selisihDisplay.innerText = `Kurang: ${formatRupiah(selisih)}`;
  }

  return {
    saldoAwal,
    penjualanShopDrive,
    penjualanBimaMotor,
    pemasukanLain,
    keteranganPemasukanLain,
    totalPemasukan,
    transferMandiri,
    cardEdc,
    penghematanTradeIn,
    biayaOperasional,
    totalPengeluaranKas,
    sisaUangKasKecil,
    fisikRiil,
    selisih
  };
}

// Cash Denomination Calculator Logic
function setupDenominationCounter() {
  const inputs = document.querySelectorAll('.denom-input');
  const koinInput = document.getElementById('denomKoinLain');

  function calculateDenom() {
    let total = 0;
    inputs.forEach(input => {
      const denom = Number(input.dataset.denom) || 0;
      const count = Number(input.value) || 0;
      total += denom * count;
    });

    const koinVal = Number(koinInput?.value) || 0;
    total += koinVal;

    document.getElementById('denomTotalDisplay').innerText = formatRupiah(total);
    return total;
  }

  inputs.forEach(input => {
    input.addEventListener('input', calculateDenom);
  });
  koinInput?.addEventListener('input', calculateDenom);

  document.getElementById('btnResetDenom')?.addEventListener('click', () => {
    inputs.forEach(input => input.value = '0');
    if (koinInput) koinInput.value = '0';
    calculateDenom();
  });

  document.getElementById('btnApplyDenom')?.addEventListener('click', () => {
    const total = calculateDenom();
    const fisikInput = document.getElementById('inputFisikRiil');
    if (fisikInput) {
      fisikInput.value = total.toLocaleString('id-ID');
      recalculateAll();
    }
  });

  document.getElementById('btnToggleDenom')?.addEventListener('click', () => {
    const card = document.getElementById('denomCard');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-2', 'ring-indigo-500');
      setTimeout(() => card.classList.remove('ring-2', 'ring-indigo-500'), 1500);
    }
  });
}

// Initialize clean database if empty
function initSampleDataIfEmpty() {
  // Clean initialization with no dummy data
}

// -------------------------------------------------------------
// KALENDER HARIAN KAS BENGKEL LOGIC
// -------------------------------------------------------------
const monthNamesIndo = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthYearEl = document.getElementById('calendarMonthYear');
  const selectedDateInput = document.getElementById('inputTanggal')?.value;
  const records = getSavedRecords();

  if (!grid || !monthYearEl) return;

  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();

  monthYearEl.innerText = `${monthNamesIndo[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const recordMap = new Map();
  records.forEach(rec => {
    if (rec.tanggal) {
      recordMap.set(rec.tanggal, rec);
    }
  });

  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'py-2 text-slate-300 pointer-events-none';
    grid.appendChild(emptyCell);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  for (let day = 1; day <= totalDays; day++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;

    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDateInput;
    const hasRecord = recordMap.has(dateStr);
    const recData = hasRecord ? recordMap.get(dateStr) : null;

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.dataset.date = dateStr;

    let baseClass = 'py-2 px-1 rounded-xl transition flex flex-col items-center justify-center relative cursor-pointer font-medium ';
    
    if (isSelected) {
      baseClass += 'bg-blue-600 text-white font-black shadow-md ';
    } else if (isToday) {
      baseClass += 'bg-blue-50 text-blue-900 border border-blue-300 font-bold hover:bg-blue-100 ';
    } else if (hasRecord) {
      baseClass += 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold hover:bg-emerald-100 ';
    } else {
      baseClass += 'text-slate-700 hover:bg-slate-100 ';
    }

    cell.className = baseClass;

    let dotHtml = '';
    if (hasRecord) {
      const dotColor = isSelected ? 'bg-amber-300' : 'bg-emerald-500';
      dotHtml = `<span class="w-1.5 h-1.5 rounded-full ${dotColor} mt-0.5" title="Ada catatan kas: ${formatRupiah(recData.totalPemasukan)}"></span>`;
    }

    cell.innerHTML = `
      <span class="text-xs leading-none">${day}</span>
      ${dotHtml}
    `;

    cell.addEventListener('click', () => {
      selectDateFromCalendar(dateStr);
    });

    grid.appendChild(cell);
  }

  updateCalendarSelectedInfo(selectedDateInput);
}

function selectDateFromCalendar(dateStr) {
  const inputTanggal = document.getElementById('inputTanggal');
  if (inputTanggal) {
    inputTanggal.value = dateStr;
  }

  const records = getSavedRecords();
  const existingRecord = records.find(r => r.tanggal === dateStr);

  if (existingRecord) {
    loadRecordToForm(existingRecord.id);
  } else {
    const settings = getAppSettings();
    setKasirValue(settings.defaultKasir || '');
    document.getElementById('inputCatatan').value = '';
    document.getElementById('inputPenjualanShopDrive').value = '0';
    document.getElementById('inputPenjualanBimaMotor').value = '0';
    document.getElementById('inputPemasukanLain').value = '0';
    document.getElementById('inputKeteranganPemasukanLain').value = '';
    document.getElementById('inputTransferMandiri').value = '0';
    document.getElementById('inputCardEdc').value = '0';
    document.getElementById('inputPenghematanTradeIn').value = '0';
    document.getElementById('inputFisikRiil').value = '0';
    currentExpenses = [];
    renderExpenses();
    recalculateAll();
  }

  renderCalendar();
}

function updateCalendarSelectedInfo(dateStr) {
  const infoEl = document.getElementById('calendarSelectedInfo');
  if (!infoEl) return;

  if (!dateStr) {
    infoEl.innerText = 'Pilih tanggal pada kalender';
    return;
  }

  const records = getSavedRecords();
  const rec = records.find(r => r.tanggal === dateStr);

  const parts = dateStr.split('-');
  const formattedDate = `${parts[2]} ${monthNamesIndo[Number(parts[1]) - 1]} ${parts[0]}`;

  if (rec) {
    infoEl.innerHTML = `
      <span class="text-emerald-700"><i class="fa-solid fa-circle-check"></i> ${formattedDate}: Sisa Kas ${formatRupiah(rec.sisaUangKasKecil)}</span>
    `;
  } else {
    infoEl.innerHTML = `
      <span class="text-slate-500"><i class="fa-regular fa-calendar"></i> ${formattedDate} (Belum ada rekap)</span>
    `;
  }
}

function setupCalendarControls() {
  document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('btnNextMonth')?.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('btnCalendarToday')?.addEventListener('click', () => {
    currentCalDate = new Date();
    const todayStr = currentCalDate.toISOString().split('T')[0];
    selectDateFromCalendar(todayStr);
  });

  document.getElementById('inputTanggal')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      const parts = val.split('-');
      currentCalDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      renderCalendar();
      updateCalendarSelectedInfo(val);
    }
  });
}

// -------------------------------------------------------------
// SETTINGS, RUMUS & DATABASE MODAL MANAGEMENT
// -------------------------------------------------------------
const SETTINGS_KEY = 'kas_bengkel_app_settings_v1';

function getAppSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {
      defaultKasir: '',
      defaultModal: 0,
      bengkelName: 'Shop & Drive & Bima Motor'
    };
  } catch (e) {
    return {
      defaultKasir: '',
      defaultModal: 0,
      bengkelName: 'Shop & Drive & Bima Motor'
    };
  }
}

function saveAppSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

function switchModalTab(targetTab) {
  const tabs = ['Rumus', 'Pengaturan', 'Database'];
  tabs.forEach(tab => {
    const btn = document.getElementById(`modalTabBtn${tab}`);
    const content = document.getElementById(`tabContent${tab}`);
    if (tab === targetTab) {
      btn?.classList.remove('border-transparent', 'text-slate-500');
      btn?.classList.add('border-blue-600', 'text-blue-900', 'font-extrabold');
      content?.classList.remove('hidden');
    } else {
      btn?.classList.remove('border-blue-600', 'text-blue-900', 'font-extrabold');
      btn?.classList.add('border-transparent', 'text-slate-500');
      content?.classList.add('hidden');
    }
  });
}

function setupDatabaseModal() {
  const modal = document.getElementById('dbModal');
  const btnOpenSettings = document.getElementById('btnOpenSettingsModal');
  const btnOpenDb = document.getElementById('btnOpenDbModal');
  const btnClose1 = document.getElementById('btnCloseDbModal');
  const btnClose2 = document.getElementById('btnCloseDbModal2');
  const btnBackupJson = document.getElementById('btnBackupJson');
  const btnBackupSql = document.getElementById('btnBackupSql');
  const btnTriggerRestore = document.getElementById('btnTriggerRestore');
  const fileInput = document.getElementById('dbFileInput');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  // Tab buttons
  document.getElementById('modalTabBtnRumus')?.addEventListener('click', () => switchModalTab('Rumus'));
  document.getElementById('modalTabBtnPengaturan')?.addEventListener('click', () => switchModalTab('Pengaturan'));
  document.getElementById('modalTabBtnDatabase')?.addEventListener('click', () => switchModalTab('Database'));

  function updateDbStats() {
    const records = getSavedRecords();
    const totalEl = document.getElementById('dbTotalRecords');
    if (totalEl) totalEl.innerText = `${records.length} Transaksi`;
  }

  function loadSettingsToModal() {
    const settings = getAppSettings();
    const inputKasir = document.getElementById('settingDefaultKasir');
    const inputModal = document.getElementById('settingDefaultModal');
    const inputBengkel = document.getElementById('settingBengkelName');

    if (inputKasir) {
      const val = settings.defaultKasir || '';
      let found = false;
      for (let i = 0; i < inputKasir.options.length; i++) {
        if (inputKasir.options[i].value.toLowerCase() === val.toLowerCase()) {
          inputKasir.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found && val) {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        inputKasir.appendChild(opt);
        inputKasir.value = val;
      } else if (!found) {
        inputKasir.value = '';
      }
    }
    if (inputModal) inputModal.value = Number(settings.defaultModal || 0).toLocaleString('id-ID');
    if (inputBengkel) inputBengkel.value = settings.bengkelName || '';
  }

  // Open via Settings button (defaults to Tab 1: Rumus)
  btnOpenSettings?.addEventListener('click', () => {
    updateDbStats();
    loadSettingsToModal();
    switchModalTab('Rumus');
    modal?.classList.remove('hidden');
  });

  // Open via Database button (defaults to Tab 3: Database)
  btnOpenDb?.addEventListener('click', () => {
    updateDbStats();
    loadSettingsToModal();
    switchModalTab('Database');
    modal?.classList.remove('hidden');
  });

  [btnClose1, btnClose2].forEach(btn => {
    btn?.addEventListener('click', () => modal?.classList.add('hidden'));
  });

  // Save Settings
  btnSaveSettings?.addEventListener('click', () => {
    const defaultKasir = document.getElementById('settingDefaultKasir')?.value.trim() || 'Kasir';
    const defaultModal = parseNumber(document.getElementById('settingDefaultModal')?.value || 0);
    const bengkelName = document.getElementById('settingBengkelName')?.value.trim() || 'Shop & Drive & Bima Motor';

    saveAppSettings({ defaultKasir, defaultModal, bengkelName });
    alert('Pengaturan operasional berhasil disimpan!');
    modal?.classList.add('hidden');
  });

  // Backup JSON
  btnBackupJson?.addEventListener('click', () => {
    const records = getSavedRecords();
    const dbExport = {
      database: 'KasBengkelShopDriveDB',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      data: records
    };

    const blob = new Blob([JSON.stringify(dbExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Kas_Bengkel_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Backup SQL Dump
  btnBackupSql?.addEventListener('click', () => {
    const records = getSavedRecords();
    let sql = `-- DATABASE DUMP: MONITOR KAS KECIL BENGKEL\n`;
    sql += `-- Generated At: ${new Date().toISOString()}\n\n`;
    sql += `CREATE TABLE IF NOT EXISTS tbl_rekap_kas (\n`;
    sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
    sql += `  tanggal DATE,\n`;
    sql += `  kasir VARCHAR(100),\n`;
    sql += `  saldo_awal BIGINT,\n`;
    sql += `  penjualan_shop_drive BIGINT,\n`;
    sql += `  penjualan_bima_motor BIGINT,\n`;
    sql += `  pemasukan_lain BIGINT,\n`;
    sql += `  keterangan_pemasukan_lain TEXT,\n`;
    sql += `  total_pemasukan BIGINT,\n`;
    sql += `  transfer_mandiri BIGINT,\n`;
    sql += `  card_edc BIGINT,\n`;
    sql += `  penghematan_trade_in BIGINT,\n`;
    sql += `  biaya_operasional BIGINT,\n`;
    sql += `  total_pengeluaran_kas BIGINT,\n`;
    sql += `  sisa_uang_kas_kecil BIGINT,\n`;
    sql += `  fisik_riil BIGINT,\n`;
    sql += `  selisih BIGINT,\n`;
    sql += `  catatan TEXT,\n`;
    sql += `  created_at TIMESTAMP\n`;
    sql += `);\n\n`;

    records.forEach(r => {
      const catEscaped = (r.catatan || '').replace(/'/g, "''");
      const kasirEscaped = (r.kasir || '').replace(/'/g, "''");
      const ketLainEscaped = (r.keteranganPemasukanLain || '').replace(/'/g, "''");
      sql += `INSERT INTO tbl_rekap_kas VALUES ('${r.id}', '${r.tanggal}', '${kasirEscaped}', ${r.saldoAwal || 0}, ${r.penjualanShopDrive || 0}, ${r.penjualanBimaMotor || 0}, ${r.pemasukanLain || 0}, '${ketLainEscaped}', ${r.totalPemasukan || 0}, ${r.transferMandiri || 0}, ${r.cardEdc || 0}, ${r.penghematanTradeIn || 0}, ${r.biayaOperasional || 0}, ${r.totalPengeluaranKas || 0}, ${r.sisaUangKasKecil || 0}, ${r.fisikRiil || 0}, ${r.selisih || 0}, '${catEscaped}', '${r.createdAt || new Date().toISOString()}');\n`;
    });

    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Database_Kas_Bengkel_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Restore JSON File
  btnTriggerRestore?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const recordsToRestore = Array.isArray(parsed) ? parsed : (parsed.data || []);

        if (!Array.isArray(recordsToRestore) || recordsToRestore.length === 0) {
          alert('Format file cadangan tidak valid atau kosong.');
          return;
        }

        if (confirm(`Pulihkan ${recordsToRestore.length} data kas dari file cadangan?`)) {
          saveRecordsToStorage(recordsToRestore);
          renderHistoryTable();
          renderCalendar();
          updateDbStats();
          modal?.classList.add('hidden');
          alert('Database kas bengkel berhasil dipulihkan!');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file database JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  });
}

// Populate Print/PDF Container
function populatePrintContainer(data) {
  const calc = data || {
    ...recalculateAll(),
    tanggal: document.getElementById('inputTanggal').value,
    kasir: document.getElementById('inputKasir').value || 'Staff Kasir',
    catatan: document.getElementById('inputCatatan').value,
    expenses: currentExpenses
  };

  document.getElementById('printTanggalHeader').innerText = `Tanggal: ${calc.tanggal || new Date().toLocaleDateString('id-ID')}`;
  document.getElementById('printKasir').innerText = calc.kasir || '-';
  document.getElementById('printTime').innerText = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('printSignKasir').innerText = `( ${calc.kasir || 'Kasir'} )`;

  document.getElementById('printSaldoAwal').innerText = formatRupiah(calc.saldoAwal);
  document.getElementById('printShopDrive').innerText = formatRupiah(calc.penjualanShopDrive);
  document.getElementById('printBimaMotor').innerText = formatRupiah(calc.penjualanBimaMotor);
  const printPemasukanLainEl = document.getElementById('printPemasukanLain');
  if (printPemasukanLainEl) printPemasukanLainEl.innerText = formatRupiah(calc.pemasukanLain || 0);
  const printKetPemasukanLainEl = document.getElementById('printKetPemasukanLain');
  if (printKetPemasukanLainEl) printKetPemasukanLainEl.innerText = calc.keteranganPemasukanLain ? `(${calc.keteranganPemasukanLain})` : '';
  document.getElementById('printTotalPemasukan').innerText = formatRupiah(calc.totalPemasukan);

  document.getElementById('printTransferMandiri').innerText = `(${formatRupiah(calc.transferMandiri)})`;
  document.getElementById('printCardEdc').innerText = `(${formatRupiah(calc.cardEdc)})`;
  document.getElementById('printPenghematanTradeIn').innerText = `(${formatRupiah(calc.penghematanTradeIn)})`;
  document.getElementById('printTotalBiayaOps').innerText = `(${formatRupiah(calc.biayaOperasional)})`;
  document.getElementById('printTotalPengeluaranKas').innerText = `(${formatRupiah(calc.totalPengeluaranKas)})`;

  document.getElementById('printSisaKas').innerText = formatRupiah(calc.sisaUangKasKecil);
  document.getElementById('printFisikRiil').innerText = formatRupiah(calc.fisikRiil);

  const selisihText = calc.selisih === 0 ? 'Rp 0 (PAS / SESUAI)' : (calc.selisih > 0 ? `+${formatRupiah(calc.selisih)} (LEBIH)` : `${formatRupiah(calc.selisih)} (KURANG)`);
  document.getElementById('printSelisih').innerText = selisihText;

  const expContainer = document.getElementById('printExpenseDetails');
  if (expContainer) {
    if (calc.expenses && calc.expenses.length > 0) {
      expContainer.innerHTML = calc.expenses.map((item, idx) => `
        <div class="flex justify-between border-b border-slate-200 pb-0.5">
          <span>${idx + 1}. ${item.desc || 'Biaya operasional'}</span>
          <span class="font-bold">${formatRupiah(item.amount)}</span>
        </div>
      `).join('');
    } else {
      expContainer.innerHTML = '<div class="text-slate-500 italic">Tidak ada rincian pengeluaran operasional</div>';
    }
  }

  return calc;
}

// -------------------------------------------------------------
// DOWNLOAD TO PDF FUNCTION (html2pdf.js)
// -------------------------------------------------------------
function downloadReportAsPdf(data) {
  const calc = populatePrintContainer(data);
  const element = document.getElementById('pdfExportContainer');

  // Temporarily display the print container so html2pdf can render it
  const printArea = document.getElementById('printArea');
  printArea.classList.remove('hidden');

  const filename = `Laporan_Kas_Bengkel_${calc.tanggal || new Date().toISOString().slice(0, 10)}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Generate PDF
  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save().then(() => {
      printArea.classList.add('hidden');
    }).catch(err => {
      console.error('PDF generation error:', err);
      printArea.classList.add('hidden');
      alert('Terjadi kesalahan saat membuat PDF: ' + err.message);
    });
  } else {
    printArea.classList.add('hidden');
    // Fallback to browser print as PDF
    window.print();
  }
}

// Print Cash Report
function printCashReport(data) {
  populatePrintContainer(data);
  window.print();
}

function printSpecificRecord(id) {
  const records = getSavedRecords();
  const record = records.find(r => r.id === id);
  if (record) {
    printCashReport(record);
  }
}

function downloadSpecificRecordPdf(id) {
  const records = getSavedRecords();
  const record = records.find(r => r.id === id);
  if (record) {
    downloadReportAsPdf(record);
  }
}

// Render History Table
function renderHistoryTable() {
  const records = getSavedRecords();
  const tbody = document.getElementById('historyTableBody');
  const tfoot = document.getElementById('historyTableFoot');
  const emptyNotice = document.getElementById('emptyHistoryNotice');
  const filterQuery = (document.getElementById('filterSearch')?.value || '').toLowerCase();

  if (!tbody) return;

  const filtered = records.filter(rec => {
    if (!filterQuery) return true;
    return (
      (rec.tanggal || '').toLowerCase().includes(filterQuery) ||
      (rec.kasir || '').toLowerCase().includes(filterQuery) ||
      (rec.catatan || '').toLowerCase().includes(filterQuery)
    );
  });

  tbody.innerHTML = '';
  if (tfoot) tfoot.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }

  if (emptyNotice) emptyNotice.classList.add('hidden');

  // Calculate Column Sums (Jumlah ke bawah)
  const sumShopDrive = filtered.reduce((sum, r) => sum + (Number(r.penjualanShopDrive) || 0), 0);
  const sumBimaMotor = filtered.reduce((sum, r) => sum + (Number(r.penjualanBimaMotor) || 0), 0);
  const sumPemasukanLain = filtered.reduce((sum, r) => sum + (Number(r.pemasukanLain) || 0), 0);
  const sumPemasukan = filtered.reduce((sum, r) => sum + (Number(r.totalPemasukan) || 0), 0);
  const sumMandiri = filtered.reduce((sum, r) => sum + (Number(r.transferMandiri) || 0), 0);
  const sumEdc = filtered.reduce((sum, r) => sum + (Number(r.cardEdc) || 0), 0);
  const sumTradeIn = filtered.reduce((sum, r) => sum + (Number(r.penghematanTradeIn) || 0), 0);
  const sumBiayaOps = filtered.reduce((sum, r) => sum + (Number(r.biayaOperasional) || 0), 0);
  const sumSisaKas = filtered.reduce((sum, r) => sum + (Number(r.sisaUangKasKecil) || 0), 0);
  const sumSelisih = filtered.reduce((sum, r) => sum + (Number(r.selisih) || 0), 0);
  const takenCount = filtered.filter(r => r.sudahDiambil === true).length;
  const untakenCount = filtered.length - takenCount;

  filtered.forEach((rec) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/90 transition border-b border-slate-100';

    const isTaken = rec.sudahDiambil === true;

    const statusBadge = rec.selisih === 0 
      ? '<span class="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800">Pas</span>'
      : (rec.selisih > 0 
          ? `<span class="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800">+${formatRupiah(rec.selisih)}</span>`
          : `<span class="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 text-rose-800">${formatRupiah(rec.selisih)}</span>`);

    const checklistStatus = `
      <div class="flex flex-col items-center justify-center gap-0.5">
        <label class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold cursor-pointer transition select-none ${
          isTaken 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' 
            : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
        }" title="Klik untuk menandai Sudah / Belum Diambil">
          <input type="checkbox" class="chk-status-diambil w-3 h-3 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" data-id="${rec.id}" ${isTaken ? 'checked' : ''}>
          <span>${isTaken ? 'Diambil' : 'Belum'}</span>
        </label>
        <div>${statusBadge}</div>
      </div>
    `;

    tr.innerHTML = `
      <td class="py-1.5 px-1.5 sm:px-2 font-bold text-slate-800 whitespace-nowrap text-[10.5px]">${rec.tanggal}</td>
      <td class="py-1.5 px-1.5 sm:px-2 whitespace-nowrap text-slate-600 text-[10.5px]">${rec.kasir || '-'}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right font-semibold text-amber-700 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.penjualanShopDrive)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right font-semibold text-indigo-700 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.penjualanBimaMotor)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right font-semibold text-emerald-700 whitespace-nowrap text-[10.5px]" title="${rec.keteranganPemasukanLain ? rec.keteranganPemasukanLain : ''}">${formatRupiah(rec.pemasukanLain || 0)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-blue-900 bg-blue-50/40 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.totalPemasukan)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right text-slate-600 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.transferMandiri)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right text-slate-600 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.cardEdc)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right text-slate-600 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.penghematanTradeIn)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right font-semibold text-rose-600 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.biayaOperasional)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-emerald-950 bg-emerald-50 whitespace-nowrap text-[10.5px]">${formatRupiah(rec.sisaUangKasKecil)}</td>
      <td class="py-1.5 px-1.5 sm:px-2 text-center whitespace-nowrap">${checklistStatus}</td>
      <td class="py-1.5 px-1 sm:px-1.5 text-center whitespace-nowrap">
        <div class="inline-flex items-center gap-0.5">
          <button class="btn-load-record p-1 text-blue-600 hover:bg-blue-50 rounded transition" data-id="${rec.id}" title="Muat ke Form">
            <i class="fa-solid fa-pen-to-square text-[11px]"></i>
          </button>
          <button class="btn-pdf-record p-1 text-rose-600 hover:bg-rose-50 rounded transition" data-id="${rec.id}" title="Unduh PDF">
            <i class="fa-solid fa-file-pdf text-[11px]"></i>
          </button>
          <button class="btn-print-record p-1 text-slate-700 hover:bg-slate-100 rounded transition" data-id="${rec.id}" title="Cetak Rekap">
            <i class="fa-solid fa-print text-[11px]"></i>
          </button>
          <button class="btn-delete-record p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded transition" data-id="${rec.id}" title="Hapus Data">
            <i class="fa-solid fa-trash text-[11px]"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Render Footer Grand Total Row (Jumlah ke bawah)
  if (tfoot) {
    const totalSelisihBadge = sumSelisih === 0 
      ? '<span class="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-200 text-emerald-950 shadow-xs">Pas (Rp 0)</span>'
      : (sumSelisih > 0 
          ? `<span class="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-200 text-amber-950 shadow-xs">+${formatRupiah(sumSelisih)}</span>`
          : `<span class="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-200 text-rose-950 shadow-xs">${formatRupiah(sumSelisih)}</span>`);

    const takenSummary = `
      <div class="flex flex-col items-center gap-0.5">
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
          <i class="fa-solid fa-check mr-0.5 text-emerald-600"></i> ${takenCount} Diambil
        </span>
        ${untakenCount > 0 ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200"><i class="fa-regular fa-clock mr-0.5 text-amber-600"></i> ${untakenCount} Belum</span>` : ''}
        <div class="mt-0.5">${totalSelisihBadge}</div>
      </div>
    `;

    tfoot.innerHTML = `
      <tr>
        <td colspan="2" class="py-1.5 px-1.5 sm:px-2 text-center uppercase tracking-wider font-extrabold text-slate-800 bg-slate-200/90 rounded-bl-lg text-[10px]">
          <div class="flex items-center justify-center gap-1">
            <i class="fa-solid fa-sigma text-blue-700"></i>
            <span>TOTAL (${filtered.length})</span>
          </div>
        </td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-amber-800 bg-amber-50/80 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumShopDrive)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-indigo-800 bg-indigo-50/80 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumBimaMotor)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-emerald-800 bg-emerald-50/80 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumPemasukanLain)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-blue-950 bg-blue-100/90 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumPemasukan)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-bold text-slate-800 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumMandiri)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-bold text-slate-800 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumEdc)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-bold text-slate-800 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumTradeIn)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-rose-700 bg-rose-50/80 whitespace-nowrap border-l border-slate-200 text-[10.5px]">${formatRupiah(sumBiayaOps)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-right font-black text-emerald-950 bg-emerald-200 whitespace-nowrap border-l border-emerald-300 text-[10.5px]">${formatRupiah(sumSisaKas)}</td>
        <td class="py-1.5 px-1.5 sm:px-2 text-center whitespace-nowrap border-l border-slate-200">${takenSummary}</td>
        <td class="py-1.5 px-1 text-center whitespace-nowrap border-l border-slate-200 text-[9px] text-slate-500 font-bold">Total</td>
      </tr>
    `;
  }

  // Attach actions
  tbody.querySelectorAll('.chk-status-diambil').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const recId = e.target.dataset.id;
      const isChecked = e.target.checked;
      toggleSudahDiambil(recId, isChecked);
    });
  });

  tbody.querySelectorAll('.btn-load-record').forEach(btn => {
    btn.addEventListener('click', () => loadRecordToForm(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-pdf-record').forEach(btn => {
    btn.addEventListener('click', () => downloadSpecificRecordPdf(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-print-record').forEach(btn => {
    btn.addEventListener('click', () => printSpecificRecord(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-delete-record').forEach(btn => {
    btn.addEventListener('click', () => deleteRecord(btn.dataset.id));
  });
}

// Save Current Form to Database
function saveCurrentRecord() {
  const calc = recalculateAll();
  const tanggal = document.getElementById('inputTanggal').value;
  const kasir = document.getElementById('inputKasir').value || 'Kasir';
  const catatan = document.getElementById('inputCatatan').value;

  if (!tanggal) {
    alert('Mohon pilih tanggal pencatatan kas.');
    return;
  }

  const record = {
    id: 'REC-' + Date.now(),
    tanggal,
    kasir,
    catatan,
    saldoAwal: calc.saldoAwal,
    penjualanShopDrive: calc.penjualanShopDrive,
    penjualanBimaMotor: calc.penjualanBimaMotor,
    pemasukanLain: calc.pemasukanLain,
    keteranganPemasukanLain: calc.keteranganPemasukanLain,
    totalPemasukan: calc.totalPemasukan,
    transferMandiri: calc.transferMandiri,
    cardEdc: calc.cardEdc,
    penghematanTradeIn: calc.penghematanTradeIn,
    biayaOperasional: calc.biayaOperasional,
    totalPengeluaranKas: calc.totalPengeluaranKas,
    sisaUangKasKecil: calc.sisaUangKasKecil,
    fisikRiil: calc.fisikRiil,
    selisih: calc.selisih,
    expenses: JSON.parse(JSON.stringify(currentExpenses)),
    createdAt: new Date().toISOString()
  };

  const records = getSavedRecords();
  
  const existingIdx = records.findIndex(r => r.tanggal === tanggal);
  if (existingIdx !== -1) {
    record.id = records[existingIdx].id || record.id;
    record.sudahDiambil = records[existingIdx].sudahDiambil || false;
    records[existingIdx] = record;
  } else {
    record.sudahDiambil = false;
    records.unshift(record);
  }

  saveRecordsToStorage(records);
  renderHistoryTable();
  renderCalendar();

  alert(`Data Kas tanggal ${tanggal} (${kasir}) berhasil tersimpan ke database sistem!`);
}

// Toggle Checklist Status Pengambilan Kas
function toggleSudahDiambil(id, status) {
  const records = getSavedRecords();
  const rec = records.find(r => r.id === id);
  if (rec) {
    rec.sudahDiambil = (typeof status === 'boolean') ? status : !rec.sudahDiambil;
    saveRecordsToStorage(records);
    renderHistoryTable();
    renderCalendar();
  }
}

// Helper to set cashier dropdown value safely, supporting custom/historical names
function setKasirValue(val) {
  const el = document.getElementById('inputKasir');
  if (!el) return;
  const target = (val || '').trim();
  if (!target) {
    el.value = '';
    return;
  }
  let found = false;
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value.toLowerCase() === target.toLowerCase()) {
      el.selectedIndex = i;
      found = true;
      break;
    }
  }
  if (!found) {
    const opt = document.createElement('option');
    opt.value = target;
    opt.textContent = target;
    const customOpt = el.querySelector('option[value="__custom__"]');
    if (customOpt) {
      el.insertBefore(opt, customOpt);
    } else {
      el.appendChild(opt);
    }
    el.value = target;
  }
}

// Load a record back to form
function loadRecordToForm(id) {
  const records = getSavedRecords();
  const record = records.find(r => r.id === id);
  if (!record) return;

  document.getElementById('inputTanggal').value = record.tanggal || '';
  setKasirValue(record.kasir || '');
  document.getElementById('inputCatatan').value = record.catatan || '';
  document.getElementById('inputSaldoAwal').value = Number(record.saldoAwal || 0).toLocaleString('id-ID');
  document.getElementById('inputPenjualanShopDrive').value = Number(record.penjualanShopDrive || 0).toLocaleString('id-ID');
  document.getElementById('inputPenjualanBimaMotor').value = Number(record.penjualanBimaMotor || 0).toLocaleString('id-ID');
  document.getElementById('inputPemasukanLain').value = Number(record.pemasukanLain || 0).toLocaleString('id-ID');
  document.getElementById('inputKeteranganPemasukanLain').value = record.keteranganPemasukanLain || '';
  document.getElementById('inputTransferMandiri').value = Number(record.transferMandiri || 0).toLocaleString('id-ID');
  document.getElementById('inputCardEdc').value = Number(record.cardEdc || 0).toLocaleString('id-ID');
  document.getElementById('inputPenghematanTradeIn').value = Number(record.penghematanTradeIn || 0).toLocaleString('id-ID');
  document.getElementById('inputFisikRiil').value = Number(record.fisikRiil || 0).toLocaleString('id-ID');

  currentExpenses = record.expenses && record.expenses.length > 0 
    ? JSON.parse(JSON.stringify(record.expenses)) 
    : [];

  renderExpenses();
  recalculateAll();

  if (record.tanggal) {
    const parts = record.tanggal.split('-');
    currentCalDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    renderCalendar();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete record from Database
function deleteRecord(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data kas ini dari database?')) return;
  let records = getSavedRecords();
  records = records.filter(r => r.id !== id);
  saveRecordsToStorage(records);
  renderHistoryTable();
  renderCalendar();
}

// Clear all Database records
function clearAllHistory() {
  if (!confirm('Peringatan: Seluruh riwayat database kas bengkel akan dihapus permanen. Lanjutkan?')) return;
  saveRecordsToStorage([]);
  renderHistoryTable();
  renderCalendar();
}

// Reset form
function resetForm() {
  if (!confirm('Kosongkan semua isian form kas?')) return;
  const settings = getAppSettings();
  setKasirValue(settings.defaultKasir || '');
  document.getElementById('inputCatatan').value = '';
  document.getElementById('inputSaldoAwal').value = Number(settings.defaultModal || 0).toLocaleString('id-ID');
  document.getElementById('inputPenjualanShopDrive').value = '0';
  document.getElementById('inputPenjualanBimaMotor').value = '0';
  document.getElementById('inputPemasukanLain').value = '0';
  document.getElementById('inputKeteranganPemasukanLain').value = '';
  document.getElementById('inputTransferMandiri').value = '0';
  document.getElementById('inputCardEdc').value = '0';
  document.getElementById('inputPenghematanTradeIn').value = '0';
  document.getElementById('inputFisikRiil').value = '0';
  currentExpenses = [];
  renderExpenses();
  recalculateAll();
}

// Export All History to Excel CSV
function exportToExcelCSV() {
  const records = getSavedRecords();
  if (records.length === 0) {
    alert('Belum ada data untuk diekspor.');
    return;
  }

  const headers = [
    'Tanggal',
    'Kasir / Shift',
    'Saldo Awal Kas',
    'Penjualan Shop & Drive',
    'Penjualan Bima Motor',
    'Sumber Pemasukan Lain',
    'Ket Pemasukan Lain',
    'Total Pemasukan',
    'Transfer Bank Mandiri',
    'Card / EDC',
    'Penghematan / Trade In',
    'Pengeluaran Biaya Operasional',
    'Total Pengeluaran Kas',
    'Sisa Uang di Kas Kecil',
    'Uang Fisik Riil Laci',
    'Selisih Kas',
    'Status Pengambilan Uang Fisik',
    'Catatan / Rincian Biaya Ops'
  ];

  const rows = records.map(r => {
    const expenseSummary = (r.expenses || []).map(e => `${e.nama || e.desc || 'Biaya'} (Rp ${e.nominal || e.amount || 0})`).join('; ');
    const statusAmbil = r.sudahDiambil ? 'Sudah Diambil' : 'Belum Diambil';
    return [
      `"${r.tanggal}"`,
      `"${(r.kasir || '').replace(/"/g, '""')}"`,
      r.saldoAwal || 0,
      r.penjualanShopDrive || 0,
      r.penjualanBimaMotor || 0,
      r.pemasukanLain || 0,
      `"${(r.keteranganPemasukanLain || '').replace(/"/g, '""')}"`,
      r.totalPemasukan || 0,
      r.transferMandiri || 0,
      r.cardEdc || 0,
      r.penghematanTradeIn || 0,
      r.biayaOperasional || 0,
      r.totalPengeluaranKas || 0,
      r.sisaUangKasKecil || 0,
      r.fisikRiil || 0,
      r.selisih || 0,
      `"${statusAmbil}"`,
      `"${(r.catatan ? r.catatan + ' | ' : '') + expenseSummary.replace(/"/g, '""')}"`
    ].join(';');
  });

  // Calculate and append Grand Total row
  const sumShopDrive = records.reduce((s, r) => s + (Number(r.penjualanShopDrive) || 0), 0);
  const sumBimaMotor = records.reduce((s, r) => s + (Number(r.penjualanBimaMotor) || 0), 0);
  const sumPemasukanLain = records.reduce((s, r) => s + (Number(r.pemasukanLain) || 0), 0);
  const sumPemasukan = records.reduce((s, r) => s + (Number(r.totalPemasukan) || 0), 0);
  const sumMandiri = records.reduce((s, r) => s + (Number(r.transferMandiri) || 0), 0);
  const sumEdc = records.reduce((s, r) => s + (Number(r.cardEdc) || 0), 0);
  const sumTradeIn = records.reduce((s, r) => s + (Number(r.penghematanTradeIn) || 0), 0);
  const sumBiayaOps = records.reduce((s, r) => s + (Number(r.biayaOperasional) || 0), 0);
  const sumTotalPengeluaran = records.reduce((s, r) => s + (Number(r.totalPengeluaranKas) || 0), 0);
  const sumSisaKas = records.reduce((s, r) => s + (Number(r.sisaUangKasKecil) || 0), 0);
  const sumFisik = records.reduce((s, r) => s + (Number(r.fisikRiil) || 0), 0);
  const sumSelisih = records.reduce((s, r) => s + (Number(r.selisih) || 0), 0);

  const totalRow = [
    `"TOTAL KESELURUHAN"`,
    `"${records.length} Transaksi"`,
    `""`,
    sumShopDrive,
    sumBimaMotor,
    sumPemasukanLain,
    `""`,
    sumPemasukan,
    sumMandiri,
    sumEdc,
    sumTradeIn,
    sumBiayaOps,
    sumTotalPengeluaran,
    sumSisaKas,
    sumFisik,
    sumSelisih,
    `"Rekap Total Akumulasi Kas"`
  ].join(';');

  rows.push(totalRow);

  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Monitor_Kas_Kecil_Bengkel_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download Blank Template CSV
function downloadBlankTemplate() {
  const csvTemplate = '\uFEFFTanggal;Kasir / Shift;Saldo Awal Kas;Penjualan Shop & Drive;Penjualan Bima Motor;Sumber Pemasukan Lain;Ket Pemasukan Lain;Total Pemasukan;Transfer Bank Mandiri;Card / EDC;Penghematan / Trade In;Pengeluaran Biaya Operasional;Total Pengeluaran Kas;Sisa Uang di Kas Kecil;Uang Fisik Riil Laci;Selisih Kas;Catatan / Rincian Biaya Ops\n' +
    ';;;;;;;=SUM(D2:F2);;;;;;;;;;\n';

  const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Kas_Shop_And_Drive_Bima_Motor.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// OWNER SECURITY PIN VERIFICATION (PIN: 2209)
// -------------------------------------------------------------
const OWNER_SECURITY_PIN = '2209';
const OWNER_AUTH_SESSION_KEY = 'owner_pin_auth_session';

function setupOwnerPinModal() {
  const btnNav = document.getElementById('btnNavMonitoringBank');
  const modal = document.getElementById('ownerPinModal');
  const btnClose = document.getElementById('btnCloseOwnerPinModal');
  const btnCancel = document.getElementById('btnCancelOwnerPin');
  const form = document.getElementById('ownerPinForm');
  const inputPin = document.getElementById('inputOwnerPin');
  const errEl = document.getElementById('ownerPinError');
  const keyBtns = document.querySelectorAll('.pin-key-btn');
  const btnClear = document.getElementById('btnPinClear');
  const btnBackspace = document.getElementById('btnPinBackspace');

  if (!btnNav || !modal) return;

  function openPinModal() {
    // If already verified in this session, navigate directly
    if (sessionStorage.getItem(OWNER_AUTH_SESSION_KEY) === OWNER_SECURITY_PIN) {
      window.location.href = 'monitoring-bank.html';
      return;
    }
    inputPin.value = '';
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    modal.classList.remove('hidden');
    setTimeout(() => inputPin.focus(), 100);
  }

  function closePinModal() {
    modal.classList.add('hidden');
    inputPin.value = '';
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
  }

  function handleVerifyPin(e) {
    if (e) e.preventDefault();
    const pin = (inputPin.value || '').trim();
    if (pin === OWNER_SECURITY_PIN) {
      sessionStorage.setItem(OWNER_AUTH_SESSION_KEY, OWNER_SECURITY_PIN);
      modal.classList.add('hidden');
      window.location.href = 'monitoring-bank.html';
    } else {
      if (errEl) {
        errEl.classList.remove('hidden');
        inputPin.classList.add('border-rose-500', 'bg-rose-50/50');
      }
      inputPin.value = '';
      inputPin.focus();
    }
  }

  btnNav.addEventListener('click', openPinModal);
  btnClose?.addEventListener('click', closePinModal);
  btnCancel?.addEventListener('click', closePinModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closePinModal();
  });

  keyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (errEl) errEl.classList.add('hidden');
      inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
      if (inputPin.value.length < 4) {
        inputPin.value += btn.getAttribute('data-val');
        if (inputPin.value.length === 4) {
          handleVerifyPin();
        }
      }
    });
  });

  btnClear?.addEventListener('click', () => {
    inputPin.value = '';
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    inputPin.focus();
  });

  btnBackspace?.addEventListener('click', () => {
    inputPin.value = inputPin.value.slice(0, -1);
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    inputPin.focus();
  });

  inputPin.addEventListener('input', () => {
    inputPin.value = inputPin.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (errEl) errEl.classList.add('hidden');
    inputPin.classList.remove('border-rose-500', 'bg-rose-50/50');
    if (inputPin.value.length === 4) {
      handleVerifyPin();
    }
  });

  form?.addEventListener('submit', handleVerifyPin);
}

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initLiveClock();

  // Initialize Database Engine
  await openDatabase();

  const settings = getAppSettings();

  // Setup reactive number inputs
  [
    'inputSaldoAwal', 
    'inputPenjualanShopDrive', 
    'inputPenjualanBimaMotor', 
    'inputPemasukanLain',
    'inputTransferMandiri', 
    'inputCardEdc', 
    'inputPenghematanTradeIn', 
    'inputFisikRiil',
    'settingDefaultModal'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) setupNumberInput(el);
  });

  // Set default initial clean values (no dummy data)
  document.getElementById('inputSaldoAwal').value = Number(settings.defaultModal || 0).toLocaleString('id-ID');
  document.getElementById('inputPenjualanShopDrive').value = '0';
  document.getElementById('inputPenjualanBimaMotor').value = '0';
  document.getElementById('inputPemasukanLain').value = '0';
  const ketLainEl = document.getElementById('inputKeteranganPemasukanLain');
  if (ketLainEl) ketLainEl.value = '';
  document.getElementById('inputTransferMandiri').value = '0';
  document.getElementById('inputCardEdc').value = '0';
  document.getElementById('inputPenghematanTradeIn').value = '0';
  document.getElementById('inputFisikRiil').value = '0';
  setKasirValue(settings.defaultKasir || '');

  // Cashier dropdown listener
  const inputKasirEl = document.getElementById('inputKasir');
  inputKasirEl?.addEventListener('change', function () {
    if (this.value === '__custom__') {
      const customName = prompt('Masukkan Nama Kasir Baru / Pengganti:');
      if (customName && customName.trim()) {
        setKasirValue(customName.trim());
      } else {
        this.value = '';
      }
    }
    recalculateAll();
  });

  // Setup Modules
  setupCalendarControls();
  setupDenominationCounter();
  setupDatabaseModal();
  setupOwnerPinModal();

  // Button actions
  document.getElementById('btnAddExpense')?.addEventListener('click', addExpenseItem);
  document.getElementById('btnSaveRecord')?.addEventListener('click', saveCurrentRecord);
  document.getElementById('btnDownloadPdf')?.addEventListener('click', () => downloadReportAsPdf(null));
  document.getElementById('btnPrintReceipt')?.addEventListener('click', () => printCashReport(null));
  document.getElementById('btnResetForm')?.addEventListener('click', resetForm);
  document.getElementById('btnClearHistory')?.addEventListener('click', clearAllHistory);
  document.getElementById('btnExportAllExcel')?.addEventListener('click', exportToExcelCSV);
  document.getElementById('btnDownloadTemplate')?.addEventListener('click', downloadBlankTemplate);
  document.getElementById('filterSearch')?.addEventListener('input', renderHistoryTable);

  // Initialize sample data in storage if empty
  initSampleDataIfEmpty();

  // Initial render
  renderExpenses();
  recalculateAll();
  renderHistoryTable();
  renderCalendar();
});
