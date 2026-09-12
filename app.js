/**
 * MONITOR KAS KECIL BENGKEL (Shop & Drive & Bima Motor)
 * JavaScript logic, live reactive calculations, dynamic expense list, 
 * daily interactive calendar, denomination counter, localStorage persistence, Excel export, and print preview.
 */

// Storage Key
const STORAGE_KEY = 'kas_bengkel_shop_drive_bima_v1';

// Initial state for dynamic operational expense items
let currentExpenses = [
  { id: 1, desc: 'Bensin Operasional / Antar Barang', amount: 50000 },
  { id: 2, desc: 'Makan Siang Mekanik & Staff', amount: 75000 }
];

// Current calendar view month and year
let currentCalDate = new Date();

// Utility: Format Number to Indonesian Rupiah
function formatRupiah(number) {
  const num = Number(number) || 0;
  return 'Rp ' + Math.floor(num).toLocaleString('id-ID');
}

// Utility: Parse raw integer number from formatted string
function parseNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const clean = str.toString().replace(/[^0-9-]/g, '');
  return parseInt(clean, 10) || 0;
}

// Utility: Setup auto formatting on number input
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

// Render dynamic operational expenses list
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

  // 1. PEMASUKAN = Penjualan Shop & Drive + Penjualan Bima Motor
  const penjualanShopDrive = parseNumber(document.getElementById('inputPenjualanShopDrive')?.value || 0);
  const penjualanBimaMotor = parseNumber(document.getElementById('inputPenjualanBimaMotor')?.value || 0);
  const totalPemasukan = penjualanShopDrive + penjualanBimaMotor;

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

// LocalStorage Management
function getSavedRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return [];
  }
}

function saveRecordsToStorage(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error writing to localStorage:', e);
  }
}

// Seed default initial sample record if none exists
function initSampleDataIfEmpty() {
  const records = getSavedRecords();
  if (records.length === 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const sampleRecord = {
      id: 'REC-' + Date.now(),
      tanggal: todayStr,
      kasir: 'Ahmad (Shift 1)',
      catatan: 'Serah terima kasir lengkap, nota & struk EDC lengkap',
      saldoAwal: 500000,
      penjualanShopDrive: 4500000,
      penjualanBimaMotor: 3750000,
      totalPemasukan: 8250000,
      transferMandiri: 3400000,
      cardEdc: 1850000,
      penghematanTradeIn: 250000,
      biayaOperasional: 125000,
      totalPengeluaranKas: 5625000,
      sisaUangKasKecil: 3125000,
      fisikRiil: 3125000,
      selisih: 0,
      expenses: [
        { id: 1, desc: 'Bensin Operasional / Antar Barang', amount: 50000 },
        { id: 2, desc: 'Makan Siang Mekanik & Staff', amount: 75000 }
      ],
      createdAt: new Date().toISOString()
    };
    saveRecordsToStorage([sampleRecord]);
  }
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

  // First day of month (0 = Sun, 1 = Mon, ...)
  const firstDay = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create lookup for recorded dates: Map<YYYY-MM-DD, Record>
  const recordMap = new Map();
  records.forEach(rec => {
    if (rec.tanggal) {
      recordMap.set(rec.tanggal, rec);
    }
  });

  grid.innerHTML = '';

  // Empty cells before the first day of month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'py-2 text-slate-300 pointer-events-none';
    grid.appendChild(emptyCell);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Render each day of the month
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

    // Dot indicator if recorded
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

  // Check if a record exists for this date
  const records = getSavedRecords();
  const existingRecord = records.find(r => r.tanggal === dateStr);

  if (existingRecord) {
    loadRecordToForm(existingRecord.id);
  } else {
    // Reset form for fresh input on this date
    document.getElementById('inputKasir').value = '';
    document.getElementById('inputCatatan').value = '';
    document.getElementById('inputPenjualanShopDrive').value = '0';
    document.getElementById('inputPenjualanBimaMotor').value = '0';
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

// Setup Calendar Navigation
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

// Render History Table
function renderHistoryTable() {
  const records = getSavedRecords();
  const tbody = document.getElementById('historyTableBody');
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

  if (filtered.length === 0) {
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }

  if (emptyNotice) emptyNotice.classList.add('hidden');

  filtered.forEach((rec) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50/90 transition border-b border-slate-100';

    const statusBadge = rec.selisih === 0 
      ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Pas</span>'
      : (rec.selisih > 0 
          ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">+${formatRupiah(rec.selisih)}</span>`
          : `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">${formatRupiah(rec.selisih)}</span>`);

    tr.innerHTML = `
      <td class="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">${rec.tanggal}</td>
      <td class="py-3 px-3 whitespace-nowrap text-slate-600">${rec.kasir || '-'}</td>
      <td class="py-3 px-3 text-right font-semibold text-amber-700 whitespace-nowrap">${formatRupiah(rec.penjualanShopDrive)}</td>
      <td class="py-3 px-3 text-right font-semibold text-indigo-700 whitespace-nowrap">${formatRupiah(rec.penjualanBimaMotor)}</td>
      <td class="py-3 px-3 text-right font-black text-blue-900 bg-blue-50/40 whitespace-nowrap">${formatRupiah(rec.totalPemasukan)}</td>
      <td class="py-3 px-3 text-right text-slate-600 whitespace-nowrap">${formatRupiah(rec.transferMandiri)}</td>
      <td class="py-3 px-3 text-right text-slate-600 whitespace-nowrap">${formatRupiah(rec.cardEdc)}</td>
      <td class="py-3 px-3 text-right text-slate-600 whitespace-nowrap">${formatRupiah(rec.penghematanTradeIn)}</td>
      <td class="py-3 px-3 text-right font-semibold text-rose-600 whitespace-nowrap">${formatRupiah(rec.biayaOperasional)}</td>
      <td class="py-3 px-3 text-right font-black text-emerald-950 bg-emerald-50 whitespace-nowrap">${formatRupiah(rec.sisaUangKasKecil)}</td>
      <td class="py-3 px-3 text-center whitespace-nowrap">${statusBadge}</td>
      <td class="py-3 px-3 text-center whitespace-nowrap">
        <div class="inline-flex items-center gap-1">
          <button class="btn-load-record p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" data-id="${rec.id}" title="Muat ke Form">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-print-record p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition" data-id="${rec.id}" title="Cetak Rekap">
            <i class="fa-solid fa-print"></i>
          </button>
          <button class="btn-delete-record p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" data-id="${rec.id}" title="Hapus Data">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach actions
  tbody.querySelectorAll('.btn-load-record').forEach(btn => {
    btn.addEventListener('click', () => loadRecordToForm(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-print-record').forEach(btn => {
    btn.addEventListener('click', () => printSpecificRecord(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-delete-record').forEach(btn => {
    btn.addEventListener('click', () => deleteRecord(btn.dataset.id));
  });
}

// Save Current Form to History
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
  
  // Update if record for same date already exists, or unshift
  const existingIdx = records.findIndex(r => r.tanggal === tanggal);
  if (existingIdx !== -1) {
    records[existingIdx] = record;
  } else {
    records.unshift(record);
  }

  saveRecordsToStorage(records);
  renderHistoryTable();
  renderCalendar();

  alert(`Data Kas tanggal ${tanggal} (${kasir}) berhasil disimpan ke riwayat!`);
}

// Load a record back to form
function loadRecordToForm(id) {
  const records = getSavedRecords();
  const record = records.find(r => r.id === id);
  if (!record) return;

  document.getElementById('inputTanggal').value = record.tanggal || '';
  document.getElementById('inputKasir').value = record.kasir || '';
  document.getElementById('inputCatatan').value = record.catatan || '';
  document.getElementById('inputSaldoAwal').value = Number(record.saldoAwal || 0).toLocaleString('id-ID');
  document.getElementById('inputPenjualanShopDrive').value = Number(record.penjualanShopDrive || 0).toLocaleString('id-ID');
  document.getElementById('inputPenjualanBimaMotor').value = Number(record.penjualanBimaMotor || 0).toLocaleString('id-ID');
  document.getElementById('inputTransferMandiri').value = Number(record.transferMandiri || 0).toLocaleString('id-ID');
  document.getElementById('inputCardEdc').value = Number(record.cardEdc || 0).toLocaleString('id-ID');
  document.getElementById('inputPenghematanTradeIn').value = Number(record.penghematanTradeIn || 0).toLocaleString('id-ID');
  document.getElementById('inputFisikRiil').value = Number(record.fisikRiil || 0).toLocaleString('id-ID');

  currentExpenses = record.expenses && record.expenses.length > 0 
    ? JSON.parse(JSON.stringify(record.expenses)) 
    : [];

  renderExpenses();
  recalculateAll();

  // Sync calendar
  if (record.tanggal) {
    const parts = record.tanggal.split('-');
    currentCalDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    renderCalendar();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete a single record
function deleteRecord(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data rekap kas ini?')) return;
  let records = getSavedRecords();
  records = records.filter(r => r.id !== id);
  saveRecordsToStorage(records);
  renderHistoryTable();
  renderCalendar();
}

// Clear all history
function clearAllHistory() {
  if (!confirm('Peringatan: Seluruh riwayat pencatatan kas akan dihapus secara permanen. Lanjutkan?')) return;
  saveRecordsToStorage([]);
  renderHistoryTable();
  renderCalendar();
}

// Reset form to default
function resetForm() {
  if (!confirm('Kosongkan semua isian form kas?')) return;
  document.getElementById('inputKasir').value = '';
  document.getElementById('inputCatatan').value = '';
  document.getElementById('inputSaldoAwal').value = '0';
  document.getElementById('inputPenjualanShopDrive').value = '0';
  document.getElementById('inputPenjualanBimaMotor').value = '0';
  document.getElementById('inputTransferMandiri').value = '0';
  document.getElementById('inputCardEdc').value = '0';
  document.getElementById('inputPenghematanTradeIn').value = '0';
  document.getElementById('inputFisikRiil').value = '0';
  currentExpenses = [];
  renderExpenses();
  recalculateAll();
}

// Print Cash Report / Berita Acara Kasir
function printCashReport(data) {
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

  // Print expense details
  const expContainer = document.getElementById('printExpenseDetails');
  if (expContainer) {
    if (calc.expenses && calc.expenses.length > 0) {
      expContainer.innerHTML = calc.expenses.map((item, idx) => `
        <div class="flex justify-between border-b border-gray-200 pb-0.5">
          <span>${idx + 1}. ${item.desc || 'Biaya operasional'}</span>
          <span class="font-bold">${formatRupiah(item.amount)}</span>
        </div>
      `).join('');
    } else {
      expContainer.innerHTML = '<div class="text-gray-500 italic">Tidak ada rincian pengeluaran operasional</div>';
    }
  }

  window.print();
}

function printSpecificRecord(id) {
  const records = getSavedRecords();
  const record = records.find(r => r.id === id);
  if (record) {
    printCashReport(record);
  }
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
    'Total Pemasukan',
    'Transfer Bank Mandiri',
    'Card / EDC',
    'Penghematan / Trade In',
    'Pengeluaran Biaya Operasional',
    'Total Pengeluaran Kas',
    'Sisa Uang di Kas Kecil',
    'Uang Fisik Riil Laci',
    'Selisih Kas',
    'Catatan / Rincian Biaya Ops'
  ];

  const rows = records.map(r => {
    const expenseSummary = (r.expenses || []).map(e => `${e.desc} (Rp ${e.amount})`).join('; ');
    return [
      `"${r.tanggal}"`,
      `"${(r.kasir || '').replace(/"/g, '""')}"`,
      r.saldoAwal || 0,
      r.penjualanShopDrive || 0,
      r.penjualanBimaMotor || 0,
      r.totalPemasukan || 0,
      r.transferMandiri || 0,
      r.cardEdc || 0,
      r.penghematanTradeIn || 0,
      r.biayaOperasional || 0,
      r.totalPengeluaranKas || 0,
      r.sisaUangKasKecil || 0,
      r.fisikRiil || 0,
      r.selisih || 0,
      `"${(r.catatan ? r.catatan + ' | ' : '') + expenseSummary.replace(/"/g, '""')}"`
    ].join(';');
  });

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
  const csvTemplate = '\uFEFFTanggal;Kasir / Shift;Saldo Awal Kas;Penjualan Shop & Drive;Penjualan Bima Motor;Total Pemasukan;Transfer Bank Mandiri;Card / EDC;Penghematan / Trade In;Pengeluaran Biaya Operasional;Total Pengeluaran Kas;Sisa Uang di Kas Kecil;Uang Fisik Riil Laci;Selisih Kas;Catatan / Rincian Biaya Ops\n' +
    `2026-09-12;Shift 1 (Ahmad);500000;4500000;3750000;=D2+E2;3400000;1850000;250000;125000;=G2+H2+I2+J2;=(F2+C2)-K2;3125000;=M2-L2;Bensin Operasional Rp 50.000, Makan Siang Rp 75.000\n` +
    ';;;;;;=SUM(D2:D2);=SUM(E2:E2);=SUM(F2:F2);;;;=SUM(K2:K2);;;;';

  const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Kas_Shop_And_Drive_Bima_Motor.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();

  // Setup reactive number inputs
  [
    'inputSaldoAwal', 
    'inputPenjualanShopDrive', 
    'inputPenjualanBimaMotor', 
    'inputTransferMandiri', 
    'inputCardEdc', 
    'inputPenghematanTradeIn', 
    'inputFisikRiil'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) setupNumberInput(el);
  });

  // Set default initial demo values
  document.getElementById('inputSaldoAwal').value = '500.000';
  document.getElementById('inputPenjualanShopDrive').value = '4.500.000';
  document.getElementById('inputPenjualanBimaMotor').value = '3.750.000';
  document.getElementById('inputTransferMandiri').value = '3.400.000';
  document.getElementById('inputCardEdc').value = '1.850.000';
  document.getElementById('inputPenghematanTradeIn').value = '250.000';
  document.getElementById('inputFisikRiil').value = '3.125.000';
  document.getElementById('inputKasir').value = 'Ahmad (Shift 1)';

  // Setup Calendar & Denomination Counter
  setupCalendarControls();
  setupDenominationCounter();

  // Button actions
  document.getElementById('btnAddExpense')?.addEventListener('click', addExpenseItem);
  document.getElementById('btnSaveRecord')?.addEventListener('click', saveCurrentRecord);
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
