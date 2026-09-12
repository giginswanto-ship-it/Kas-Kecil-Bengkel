/**
 * Local Database Server for Monitor Kas Kecil Bengkel
 * Runs a standalone lightweight REST API server on http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database_kas_bengkel.json');

// Initialize database file if not exists
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    appName: 'Monitor Kas Kecil Bengkel',
    version: '1.0.0',
    records: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

function readDatabase() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { records: [] };
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;

  // Health check
  if (url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', database: 'database_kas_bengkel.json' }));
    return;
  }

  // Get all records
  if (url === '/api/records' && req.method === 'GET') {
    const db = readDatabase();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.records || []));
    return;
  }

  // Save / update record
  if (url === '/api/records' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newRecord = JSON.parse(body);
        const db = readDatabase();
        db.records = db.records || [];
        
        const existingIdx = db.records.findIndex(r => r.id === newRecord.id || r.tanggal === newRecord.tanggal);
        if (existingIdx !== -1) {
          db.records[existingIdx] = newRecord;
        } else {
          db.records.unshift(newRecord);
        }
        writeDatabase(db);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Record saved to database file', record: newRecord }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve static files if opened through localhost:3000
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentType = ext === '.html' ? 'text/html' : (ext === '.js' ? 'application/javascript' : (ext === '.css' ? 'text/css' : 'text/plain'));
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log('========================================================');
  console.log(`✅ Database Server Kas Bengkel berjalan di: http://localhost:${PORT}`);
  console.log(`📁 File Database: ${DB_FILE}`);
  console.log('========================================================');
});
