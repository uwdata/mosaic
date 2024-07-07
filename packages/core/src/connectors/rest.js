import { tableFromIPC } from 'apache-arrow';

export function restConnector(uri = 'http://localhost:3000/') {
  return {
    /**
     * Query the DuckDB server.
     * @param {object} query
     * @param {'exec' | 'arrow' | 'json' | 'create-bundle' | 'load-bundle'} [query.type] The query type.
     * @param {string} query.sql A SQL query string.
     * @returns the query result
     */
    async query(query) {
      const req = fetch(uri, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      return query.type === 'json' ? (await req).json()
        : query.type === 'arrow' ? tableFromIPC(req)
        : req;
    }
  };
}
