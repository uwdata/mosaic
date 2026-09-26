// A spawnable stand-in for a server target in runner tests. Answers the
// readiness probe and plain SELECTs immediately with a one-row Arrow stream
// (HTTP and WebSocket); any command whose SQL mentions CREATE is a "slow
// mutation" that is answered after --delay ms over HTTP and never over
// WebSocket, so timeouts can be provoked on either wire.
import { createServer } from 'node:http';
import { tableFromArrays, tableToIPC } from '@uwdata/flechette';
import { WebSocketServer } from 'ws';

const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]);
const delay = args.includes('--delay') ? Number(args[args.indexOf('--delay') + 1]) : 500;
const stream = tableToIPC(tableFromArrays({ x: [1] }), { format: 'stream' });
const slow = sql => /CREATE/i.test(String(sql ?? ''));

const server = createServer((req, res) => {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let command = {};
    try { command = JSON.parse(body || '{}'); } catch { /* readiness probe or garbage */ }
    const answer = () => {
      if (command.type === 'exec') { res.statusCode = 200; res.end(); return; }
      res.statusCode = 200;
      res.setHeader('content-type', 'application/vnd.apache.arrow.stream');
      res.end(Buffer.from(stream));
    };
    if (slow(command.sql)) setTimeout(answer, delay);
    else answer();
  });
});

new WebSocketServer({ server }).on('connection', socket => {
  socket.on('message', data => {
    let command = {};
    try { command = JSON.parse(String(data)); } catch { socket.send(JSON.stringify({ error: 'bad json', code: 'bad_request', reason: 'malformed_json' })); return; }
    if (slow(command.sql)) return;
    if (command.type === 'exec') socket.send('{}');
    else socket.send(Buffer.from(stream));
  });
});

server.listen(port, '127.0.0.1');
