export function socket(uri = 'ws://localhost:3000/') {
  let ws;
  let connected = false;
  let request = null;
  const queue = [];

  const events = {
    open: () => {
      connected = true;
      next();
    },
    close: () => {
      connected = false;
      request = null;
      ws = null;
      while (queue.length) {
        queue.shift().reject('Socket closed');
      }
    },
    error: event => {
      if (request) {
        const { reject } = request;
        request = null;
        next();
        reject(event);
      } else {
        console.error('WebSocket error: ', event);
      }
    },
    message: ({ data }) => {
      if (request) {
        const { resolve, reject } = request;

        // clear state, start next request
        request = null;
        next();

        // process result
        if (data?.arrayBuffer) {
          resolve(data.arrayBuffer());
        } else {
          const json = JSON.parse(data);
          if (json.error) {
            reject(json.error);
          } else {
            resolve({ json: () => json });
          }
        }
      } else {
        console.log('WebSocket message: ', data);
      }
    }
  }

  function init() {
    ws = new WebSocket(uri);
    for (const type in events) {
      ws.addEventListener(type, events[type]);
    }
  }

  function enqueue(query, resolve, reject) {
    if (ws == null) init();
    queue.push({ body: JSON.stringify(query), resolve, reject });
    if (connected && !request) next();
  }

  function next() {
    if (queue.length) {
      request = queue.shift();
      ws.send(request.body);
    }
  }

  return query => new Promise(
    (resolve, reject) => enqueue(query, resolve, reject)
  );
}
