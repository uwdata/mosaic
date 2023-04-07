import { tableFromIPC } from 'apache-arrow';

export function restConnector(uri = 'https://localhost:443/') {
  return {
    async query(query) {
      const req = fetch(uri, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      return query.type === 'exec' ? req
        : query.type === 'arrow' ? tableFromIPC(req)
        : (await req).json();
    }
  };
}
