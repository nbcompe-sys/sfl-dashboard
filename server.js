const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sfl.NTA2Mg.ufGVWqh-nGGqWKNS90XeUYCvjL6xB-_mMreTkz6CIYg';
const FARM_ID = '5062';
const PORT = process.env.PORT || 3333;

function fetchFarm() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.sunflower-land.com',
      path: `/community/farms/${FARM_ID}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'x-api-key': API_KEY,
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS — allow any origin so dashboard can call this from anywhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = req.url.split('?')[0];

  // Serve dashboard HTML
  if (url === '/' || url === '/index.html') {
    try {
      const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(html);
    } catch(e) {
      res.writeHead(500);
      res.end('Dashboard file not found');
    }
    return;
  }

  // Health check
  if (url === '/ping') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, time: new Date().toISOString() }));
    return;
  }

  // Farm data API
  if (url === '/farm') {
    res.setHeader('Content-Type', 'application/json');
    console.log('[' + new Date().toLocaleTimeString() + '] Fetching farm...');
    try {
      const r = await fetchFarm();
      console.log('  Status:', r.status, '— bytes:', r.body.length);
      res.writeHead(r.status);
      res.end(r.body);
    } catch(e) {
      console.error('  Error:', e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log('');
  console.log('🌻 SFL Dashboard running on port', PORT);
  console.log('');
});
