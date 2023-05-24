import {
  coordinator, socketConnector, restConnector, wasmConnector
} from '@uwdata/vgplot';

export * from  '@uwdata/vgplot';

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
