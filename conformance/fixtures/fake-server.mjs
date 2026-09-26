// A spawnable stand-in for a server target in runner tests. Answers the
// readiness probe and plain SELECTs immediately with a one-row Arrow stream;
// any command whose SQL mentions CREATE is a "slow mutation" answered after
// --delay ms, so timeouts can be provoked on demand. `--tls close` serves
// HTTPS the way Node and Rust do (a plaintext request gets the socket
// closed); `--tls plaintext-400` mimics Go's net/http, which answers it with
// `400 Client sent an HTTP request to an HTTPS server`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createServer as createTlsServer } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tableFromArrays, tableToIPC } from '@uwdata/flechette';

const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]);
const delay = args.includes('--delay') ? Number(args[args.indexOf('--delay') + 1]) : 500;
const tls = args.includes('--tls') ? args[args.indexOf('--tls') + 1] : undefined;

function selfSigned() {
  const dir = mkdtempSync(join(tmpdir(), 'conformance-tls-'));
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem'), '-subj', '/CN=localhost', '-days', '1'], { stdio: 'ignore' });
  return { key: readFileSync(join(dir, 'key.pem')), cert: readFileSync(join(dir, 'cert.pem')) };
}
const stream = tableToIPC(tableFromArrays({ x: [1] }), { format: 'stream' });
const slow = sql => /CREATE/i.test(String(sql ?? ''));

const handler = (req, res) => {
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
};

const server = tls ? createTlsServer(selfSigned(), handler) : createServer(handler);
if (tls === 'plaintext-400') {
  // Node's https server destroys the socket on a non-TLS client hello; Go
  // writes an HTTP 400 first. Reproduce Go by answering the hello in plain
  // text before dropping the socket.
  server.on('tlsClientError', (err, socket) => {
    if (/wrong version number|http request/i.test(err.message) && socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain; charset=utf-8\r\nConnection: close\r\n\r\nClient sent an HTTP request to an HTTPS server.\n');
    } else {
      socket.destroy();
    }
  });
}
server.listen(port, '127.0.0.1');
