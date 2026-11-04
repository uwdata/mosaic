import { Coordinator, decodeIPC, DuckDBWASMConnector, RestConnector } from '@uwdata/mosaic-core';
import { clickHouseCodeGenerator, duckDBCodeGenerator } from '@uwdata/mosaic-sql';
import { createAPIContext } from '@uwdata/vgplot';
import { devClickHouseConnector } from './clickhouse/connector.js';

export { parseSpec, astToDOM, astToESM } from '@uwdata/mosaic-spec';
export let vg = createAPIContext();

// make API accessible for console debugging
Object.assign(self, { vg });

// enable query interface on global this (window)
Object.assign(self, {
  query: async (sql) => {
    const bytes = await vg.coordinator().databaseConnector().query({
      type: 'arrow',
      sql
    });
    return decodeIPC(bytes).toArray();
  }
});

export let { coordinator, namedPlots } = vg.context;

export function clear(api = vg) {
  const { coordinator, namedPlots } = api.context;
  for (const client of coordinator.clients) client.destroy();
  coordinator.clear();
  coordinator.preaggregator.clear();
  namedPlots.clear();
}

let wasm;

export async function setDatabaseConnector(type) {
  let connector;
  switch (type) {
    case 'rest':
      connector = new RestConnector();
      break;
    case 'rest_https':
      connector = new RestConnector({ uri: 'https://localhost:3000/' });
      break;
    case 'clickhouse':
      connector = devClickHouseConnector();
      break;
    case 'wasm':
      if (!wasm) {
        wasm = new DuckDBWASMConnector();
        await installDatasketches(wasm);
      }
      connector = wasm;
      break;
    default:
      throw new Error(`Unrecognized connector type: ${type}`);
  }
  console.log('Database Connector', type);
  clear();
  coordinator = new Coordinator(connector, {
    codegen: type === 'clickhouse' ? clickHouseCodeGenerator : duckDBCodeGenerator,
    preagg: { enabled: type !== 'clickhouse' }
  });
  vg = createAPIContext({ coordinator });
  namedPlots = vg.context.namedPlots;
  Object.assign(self, { vg });
}

async function installDatasketches(connector) {
  try {
    for (const sql of [
      'SET allow_extension_repositories = \'allowed\'',
      'CREATE EXTENSION REPOSITORY IF NOT EXISTS query_farm WITH PREFIX \'https://duckdb-extensions.query.farm\'',
      'LOAD datasketches FROM query_farm'
    ]) {
      await connector.query({ type: 'exec', sql });
    }
  } catch (error) {
    console.warn('Could not load datasketches', error);
  }
}
