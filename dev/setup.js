import { socketConnector, restConnector, wasmConnector } from '@uwdata/mosaic-core';
import { createAPIContext } from '@uwdata/vgplot';

export { parseSpec, astToDOM, astToESM } from '@uwdata/mosaic-spec';
export const vg = createAPIContext();

// make API accesible for console debugging
self.vg = vg;

// enable query interface
self.query = async (sql) => {
  const r = await vg.coordinator().databaseConnector().query({
    type: 'arrow',
    sql
  });
  return r.toArray();
}

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
      connector = socketConnector();
      break;
    case 'rest':
      connector = restConnector();
      break;
    case 'rest_https':
      connector = restConnector('https://localhost:3000/');
      break;
    case 'wasm':
      connector = wasm || (wasm = wasmConnector());
      break;
    default:
      throw new Error(`Unrecognized connector type: ${type}`);
  }
  console.log('Database Connector', type);
  coordinator.databaseConnector(connector);
}
