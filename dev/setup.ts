import { DuckDBWASMConnector, RestConnector, SocketConnector } from '@uwdata/mosaic-core';
import { createAPIContext } from '@uwdata/vgplot';

export { parseSpec, astToDOM, astToESM } from '@uwdata/mosaic-spec';
export const vg = createAPIContext();

// ---- BEGIN CACHE-SIZE INSTRUMENTATION (via connector wrap) -----------------
const sizes: number[] = [];

function wrapConnectorForSizing<T extends { query: (req: any) => Promise<any> }>(conn: T): T {
  const orig = conn.query.bind(conn);
  conn.query = async (req: any) => {
    const result = await orig(req);
    const size = (result as { byteLength?: number })?.byteLength ?? 0;
    console.log('[sizingCache] query', {
      type: req.type,
      size,
      shape: result?.constructor?.name ?? typeof result
    });
    if (size > 0) sizes.push(size);
    return result;
  };
  return conn;
}

(self as any).__stats = () => {
  const sorted = [...sizes].sort((a, b) => a - b);
  const pick = (q: number) => sorted[Math.floor(sorted.length * q)];
  const total = sizes.reduce((a, b) => a + b, 0);
  return {
    count: sizes.length,
    total_bytes: total,
    mean: sizes.length ? Math.round(total / sizes.length) : 0,
    median: pick(0.5),
    p75: pick(0.75),
    p95: pick(0.95),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    raw: sizes.slice()
  };
};

(self as any).__resetStats = () => {
  sizes.length = 0;
};
// ---- END CACHE-SIZE INSTRUMENTATION ----------------------------------------

// make API accessible for console debugging
Object.assign(self, { vg });

// enable query interface on global this (window)
Object.assign(self, {
  query: async (sql) => {
    const r = await vg.coordinator().databaseConnector().query({
      type: 'arrow',
      sql
    });
    return r.toArray();
  }
});

export const { coordinator, namedPlots } = vg.context;

export function clear() {
  coordinator.clear();
  namedPlots.clear();
}

let wasm;

export async function setDatabaseConnector(type) {
  let connector;
  switch (type) {
    case 'socket':
      connector = new SocketConnector();
      break;
    case 'rest':
      connector = new RestConnector();
      break;
    case 'rest_https':
      connector = new RestConnector({ uri: 'https://localhost:3000/' });
      break;
    case 'wasm':
      connector = wasm || (wasm = new DuckDBWASMConnector({
        config: { filesystem: { forceFullHTTPReads: true } }
      }));
      break;
    default:
      throw new Error(`Unrecognized connector type: ${type}`);
  }
  console.log('Database Connector', type);
  wrapConnectorForSizing(connector);
  coordinator.databaseConnector(connector);
}