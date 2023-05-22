import {
  coordinator, socketConnector, restConnector, wasmConnector, namedPlots
} from '@uwdata/vgplot';

export * from  '@uwdata/vgplot';

export function reset() {
  coordinator().clear();
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
      connector = (wasm || (wasm = await wasmConnector(options)));
      break;
    default:
      throw new Error(`Unrecognized connector type: ${type}`);
  }
  console.log('Database Connector', type);
  coordinator().databaseConnector(connector);
}
