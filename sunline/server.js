// Sunline Festival multiplayer server.
// Serves the game and relays car positions between players in the same room.
// Works on a home network or on a host such as Render.
// Needs only Node.js (18 or newer). Run:  node server.js
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');

const PORT = Number(process.env.PORT) || 8080;
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// ---- minimal WebSocket (RFC 6455) ----
function frame(text) {
  const data = Buffer.from(text), n = data.length;
  let head;
  if (n < 126) head = Buffer.from([0x81, n]);
  else if (n < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(n, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(n), 2); }
  return Buffer.concat([head, data]);
}

const players = new Map();
let nextId = 1;
const lobbies = new Map();

function send(p, obj) { if (!p.sock.destroyed) p.sock.write(frame(JSON.stringify(obj))); }
function broadcast(room, obj, except) {
  const f = frame(JSON.stringify(obj));
  for (const p of players.values()) if (p.room === room && p !== except && p.hello && !p.sock.destroyed) p.sock.write(f);
}
const roomSize = room => [...players.values()].filter(p => p.room === room && p.hello).length;

server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { sock.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  sock.setNoDelay(true);

  const p = { id: nextId++, sock, name: 'Driver', car: 'p911', paint: null, hello: false, room: 'main' };
  players.set(p.id, p);
  let buf = Buffer.alloc(0);

  sock.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const op = buf[0] & 15, masked = buf[1] & 128;
      let len = buf[1] & 127, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > 1 << 20) { sock.destroy(); return; }
      const maskOff = off;
      if (masked) off += 4;
      if (buf.length < off + len) return;
      let payload = Buffer.from(buf.subarray(off, off + len));
      if (masked) for (let i = 0; i < payload.length; i++) payload[i] ^= buf[maskOff + (i & 3)];
      buf = buf.subarray(off + len);
      if (op === 8) { sock.end(); return; }
      if (op === 9) { if (payload.length < 126) sock.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }
      if (op === 1) onMessage(p, payload.toString('utf8'));
    }
  });

  const gone = () => {
    if (!players.has(p.id)) return;
    players.delete(p.id);
    const L = lobbies.get(p.room); if (L) L.players = L.players.filter(i => i !== p.id);
    if (p.hello) { broadcast(p.room, { t: 'leave', id: p.id }); console.log(`  - ${p.name} left room ${p.room} (${roomSize(p.room)} there)`); }
  };
  sock.on('close', gone);
  sock.on('error', gone);
});

const clean = s => String(s || '').replace(/[^\w .'-]/g, '').trim().slice(0, 16) || 'Driver';
const cleanRoom = s => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'main';

function onMessage(p, text) {
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  switch (m.t) {
    case 'hello':
      p.name = clean(m.name); p.car = String(m.car).slice(0, 12); p.paint = Number(m.paint) || null; p.room = cleanRoom(m.room); p.hello = true;
      send(p, { t: 'welcome', id: p.id, room: p.room, players: [...players.values()].filter(q => q !== p && q.hello && q.room === p.room).map(q => ({ id: q.id, name: q.name, car: q.car, paint: q.paint })) });
      broadcast(p.room, { t: 'join', id: p.id, name: p.name, car: p.car, paint: p.paint }, p);
      console.log(`  + ${p.name} joined room ${p.room} (${roomSize(p.room)} there)`);
      break;
    case 's':
      if (!p.hello) return;
      m.id = p.id; broadcast(p.room, m, p);
      break;
    case 'car':
      p.car = String(m.car).slice(0, 12); p.paint = Number(m.paint) || null;
      broadcast(p.room, { t: 'car', id: p.id, car: p.car, paint: p.paint }, p);
      break;
    case 'name':
      p.name = clean(m.name); broadcast(p.room, { t: 'name', id: p.id, name: p.name }, p);
      break;
    case 'invite': {
      if (lobbies.has(p.room) || !p.hello) return;
      const race = String(m.race).slice(0, 12), room = p.room;
      lobbies.set(room, { race, players: [p.id] });
      broadcast(room, { t: 'invite', id: p.id, name: p.name, race, ms: 10000 });
      console.log(`  > ${p.name} opened a race lobby (${race}) in room ${room}`);
      setTimeout(() => { const L = lobbies.get(room); lobbies.delete(room); if (L && L.players.length) broadcast(room, { t: 'go', race: L.race, players: L.players }); }, 10000);
      break;
    }
    case 'rjoin':
      { const L = lobbies.get(p.room); if (L && !L.players.includes(p.id)) L.players.push(p.id); }
      break;
    case 'fin':
      broadcast(p.room, { t: 'fin', id: p.id, name: p.name, time: Number(m.time) || 0 });
      break;
  }
}

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\n  Port ${PORT} is already in use. Close the other program or run:  PORT=8081 node server.js\n`);
  else console.error(e);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && (i.family === 'IPv4' || i.family === 4) && !i.internal).map(i => i.address);
  console.log('\n  Sunline Festival server is running.\n');
  console.log(`  On this computer:  http://localhost:${PORT}`);
  for (const ip of ips) console.log(`  On your network:   http://${ip}:${PORT}`);
  console.log('\n  Everyone on the same Wi-Fi opens one of the network links in a browser.');
  console.log('  Press Ctrl+C to stop the server.\n');
});
