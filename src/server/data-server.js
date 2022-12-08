import http from 'node:http';

export function launchServer(dataService, {
  port = 3000
} = {}) {
  const app = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', 2592000);

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.end(JSON.stringify({ error: true }));
      return;
    }

    const onError = err => {
      console.error(err);
      res.end(JSON.stringify({ error: true }));
    };

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const query = JSON.parse(Buffer.concat(chunks));
        const t0 = Date.now();
        const result = await dataService.query(query);
        console.log('QUERY', Date.now() - t0);
        res.end(JSON.stringify(result));
      } catch (err) {
        onError(err);
      }
    });
    req.on('error', onError);
  });

  app.listen(port);
  console.log(`Data server running on port ${port}`);
  console.log(`  http://localhost:${port}/`);
}
