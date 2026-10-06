const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database_kas_bengkel.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

if (db.bankSettings && (!db.bankSettings.saldoAwal || db.bankSettings.saldoAwal === 0)) {
  db.bankSettings.saldoAwal = db.bankSettings.saldoBulanLalu || 29384422;
}

const header = `/**
 * DATA SEED AWAL SISTEM KAS KECIL & MONITORING BANK MANDIRI
 * PT DUTARAYA BERJAYA - SHOP & DRIVE & BIMA MOTOR
 * Otomatis di-bundle untuk offline & file:/// execution
 */
`;

const js = header + 'var BUNDLED_KAS_DATABASE = ' + JSON.stringify(db, null, 2) + ';\n' +
  'if (typeof window !== "undefined") {\n' +
  '  window.BUNDLED_KAS_DATABASE = BUNDLED_KAS_DATABASE;\n' +
  '}\n' +
  'if (typeof module !== "undefined" && module.exports) {\n' +
  '  module.exports = BUNDLED_KAS_DATABASE;\n' +
  '}\n';

fs.writeFileSync(path.join(__dirname, 'data-seed.js'), js, 'utf8');
console.log('data-seed.js created successfully!');
