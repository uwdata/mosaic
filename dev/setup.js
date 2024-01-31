import { socketConnector, restConnector, wasmConnector } from '@uwdata/mosaic-core';
import { createAPIContext } from '@uwdata/vgplot';

export { parseSpec, astToDOM, astToESM } from '@uwdata/mosaic-spec';
export const vg = createAPIContext();

const { coordinator, namedPlots } = vg.context;

export function clear() {
  coordinator.clear();
  namedPlots.clear();
}

let wasm;

export async function setDatabaseConnector(type, options) {
  let connector;
  switch (type) {
    case 'socket':
      connector = socketConnector(options);
      break;
    case 'rest':
      connector = restConnector(options);
      break;
    case 'wasm':
      connector = wasm || (wasm = wasmConnector(options));
      await connector.getConnection().query('INSTALL spatial; LOAD spatial;');
      break;
    default:
      throw new Error(`Unrecognized connector type: ${type}`);
  }
  console.log('Database Connector', type);
  coordinator.databaseConnector(connector);
}
