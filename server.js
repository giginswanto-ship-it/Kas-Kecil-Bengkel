/**
 * Local Database Server for Monitor Kas Kecil Bengkel
 * Runs a standalone lightweight REST API server
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple .env parser if dotenv is not installed
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const PORT = parseInt(process.env.PORT || '3019', 10);
const DB_FILE = path.join(__dirname, 'database_kas_bengkel.json');
const SQL_FILE = path.join(__dirname, 'database_kas_bengkel.sql');

// Initialize database file if not exists
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    appName: 'Monitor Kas Kecil Bengkel',
    version: '1.0.0',
    records: [],
    bankTransactions: [],
    bankSettings: {},
    appSettings: {}
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

function readDatabase() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { records: [], bankTransactions: [], bankSettings: {}, appSettings: {} };
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    const db = readDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'OK',
      port: PORT,
      database: 'database_kas_bengkel.json',
      recordsCount: (db.records || []).length,
      bankTransactionsCount: (db.bankTransactions || []).length
    }));
    return;
  }

  // 2. Full Database Export / Sync (GET)
  if (pathname === '/api/database' && req.method === 'GET') {
    const db = readDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(db));
    return;
  }

  // 3. Full Database Restore / Backup Sync (POST)
  if (pathname === '/api/database' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const db = readDatabase();
        if (Array.isArray(payload.records)) db.records = payload.records;
        if (Array.isArray(payload.bankTransactions)) db.bankTransactions = payload.bankTransactions;
        if (payload.bankSettings) db.bankSettings = { ...db.bankSettings, ...payload.bankSettings };
        if (payload.appSettings) db.appSettings = { ...db.appSettings, ...payload.appSettings };
        db.lastBackup = new Date().toISOString();
        writeDatabase(db);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Database updated successfully' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. Kas Harian Records (GET)
  if (pathname === '/api/records' && req.method === 'GET') {
    const db = readDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(db.records || []));
    return;
  }

  // 5. Kas Harian Records (POST save/update)
  if (pathname === '/api/records' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newRecord = JSON.parse(body);
        const db = readDatabase();
        db.records = db.records || [];

        const existingIdx = db.records.findIndex(r => r.id === newRecord.id || (r.tanggal === newRecord.tanggal && (r.kasir || '') === (newRecord.kasir || '')));
        if (existingIdx !== -1) {
          db.records[existingIdx] = { ...db.records[existingIdx], ...newRecord };
        } else {
          db.records.unshift(newRecord);
        }
        writeDatabase(db);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Record saved to database file', record: newRecord }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 6. Bank Mandiri Transactions (GET)
  if (pathname === '/api/bank' && req.method === 'GET') {
    const db = readDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      bankTransactions: db.bankTransactions || [],
      bankSettings: db.bankSettings || {}
    }));
    return;
  }

  // 7. Bank Mandiri Transactions (POST)
  if (pathname === '/api/bank' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const db = readDatabase();
        db.bankTransactions = db.bankTransactions || [];

        if (payload.action === 'saveTransaction' && payload.transaction) {
          const tx = payload.transaction;
          const idx = db.bankTransactions.findIndex(t => t.id === tx.id);
          if (idx !== -1) {
            db.bankTransactions[idx] = tx;
          } else {
            db.bankTransactions.unshift(tx);
          }
        } else if (payload.action === 'saveSettings' && payload.settings) {
          db.bankSettings = { ...db.bankSettings, ...payload.settings };
        } else if (Array.isArray(payload.bankTransactions)) {
          db.bankTransactions = payload.bankTransactions;
        }

        writeDatabase(db);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Bank data saved' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 8. SQL File Download Endpoint (GET)
  if (pathname === '/api/sql' && req.method === 'GET') {
    if (fs.existsSync(SQL_FILE)) {
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="database_kas_bengkel.sql"'
      });
      fs.createReadStream(SQL_FILE).pipe(res);
      return;
    }
  }

  // 9. Static File Serving with Clean URL Routing
  let requestPath = pathname;
  if (requestPath === '/' || requestPath === '') {
    requestPath = '/index.html';
  } else if (requestPath === '/bank' || requestPath === '/monitoring-bank') {
    requestPath = '/monitoring-bank.html';
  }

  // Safe path resolution
  const safePath = path.normalize(requestPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Endpoint or file not found', path: pathname }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================================');
  console.log(`✅ Database Server Kas Bengkel berjalan di: http://0.0.0.0:${PORT}`);
  console.log(`📁 File Database: ${DB_FILE}`);
  console.log('========================================================');
});
