import http from 'node:http';

function handleError(res, code, message) {
  console.error(message);
  res.writeHead(code);
  res.end();
}

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
      handleError(res, 400, `Unsupported HTTP method: ${req.method}`);
      return;
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const t0 = Date.now();
      let query;

      // parse incoming query
      try {
        query = JSON.parse(Buffer.concat(chunks));
      } catch (err) {
        handleError(res, 400, err);
        return;
      }

      // service request
      try {
        await dataService.lock();

        // ARROW BUFFER
        // const result = await dataService.arrowBuffer(query);
        // res.end(result);

        // ARROW STREAM
        const result = await dataService.arrowStream(query);
        for await (const chunk of result) {
          res.write(chunk);
        }
        res.end();

        // JSON
        // const result = await dataService.query(query);
        // res.end(JSON.stringify(result));
      } catch (err) {
        handleError(res, 500, err);
      } finally {
        dataService.unlock();
      }

      console.log('REQUEST', Date.now() - t0);
    });
    req.on('error', () => handleError(res, 500, err));
  });

  app.listen(port);
  console.log(`Data server running on port ${port}`);
  console.log(`  http://localhost:${port}/`);
}
