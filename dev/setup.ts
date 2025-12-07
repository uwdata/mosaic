import { DuckDBWASMConnector, RestConnector, SocketConnector, initializeDevtools } from '@uwdata/mosaic-core';
import { createAPIContext } from '@uwdata/vgplot';

export { parseSpec, astToDOM, astToESM } from '@uwdata/mosaic-spec';
export const vg = createAPIContext();

initializeDevtools(document)

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
  coordinator.databaseConnector(connector);
}
