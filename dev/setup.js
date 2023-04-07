import {
  coordinator, restConnector, wasmConnector, namedPlots
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
    case 'rest':
      connector = restConnector(options);
      break;
    case 'wasm':
      connector = (wasm || (wasm = await initWasmConnector(options)));
      break;
    default:
      throw new Error(`Unrecognized connector type: ${type}`);
  }
  console.log('DATABASE Connector', type);
  coordinator().databaseConnector(connector);
}

async function initWasmConnector(options) {
  const connector = await wasmConnector(options);
  const { db, con } = connector;

  async function csv(name, file) {
    const csv = await (await fetch(file)).text();
    await db.registerFileText(`${name}.csv`, csv);
    await con.insertCSVFromPath(`${name}.csv`, { name, schema: 'main' });
  }

  async function ipc(name, file) {
    const buffer = await (await fetch(file)).arrayBuffer();
    await con.insertArrowFromIPCStream(new Uint8Array(buffer), { name, schema: 'main' });
  }

  const dir = '../../data';
  await Promise.all([
    csv('athletes', `${dir}/athletes.csv`),
    csv('penguins', `${dir}/penguins.csv`),
    csv('weather', `${dir}/seattle-weather.csv`),
    ipc('flights', `${dir}/flights-200k.arrow`),
    ipc('walk', `${dir}/random-walk.arrow`)
  ]);

  return connector;
}
