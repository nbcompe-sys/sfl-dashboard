const http = require('http');
const https = require('https');

const API_KEY = 'sfl.NTA2Mg.ufGVWqh-nGGqWKNS90XeUYCvjL6xB-_mMreTkz6CIYg';
const FARM_ID = '5062';
const PORT = 3333;

function get(host, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host, path, method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0', 'x-api-key': API_KEY, ...headers }
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.url === '/ping') { res.writeHead(200); res.end(JSON.stringify({ ok: true })); return; }

  if (req.url === '/farm') {
    console.log('[' + new Date().toLocaleTimeString() + '] Fetching farm data...');
    try {
      const r = await get('api.sunflower-land.com', `/community/farms/${FARM_ID}`);
      if (r.status === 200) {
        console.log('  OK - ' + r.body.length + ' bytes');
        res.writeHead(200);
        res.end(r.body);
      } else {
        console.log('  Error status: ' + r.status);
        res.writeHead(r.status);
        res.end(r.body);
      }
    } catch(e) {
      console.log('  Error: ' + e.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log('\n🌻 SFL Dashboard Server running!');
  console.log('   Farm API: http://localhost:' + PORT + '/farm');
  console.log('   Keep this window open.\n');
});
