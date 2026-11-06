import { Connector, decodeIPC, DuckDBWASMConnector, RestConnector } from '../packages/mosaic/core/src';
import { createAPIContext } from '../packages/vgplot/vgplot/src';

export { parseSpec, astToDOM, astToESM } from '../packages/vgplot/spec/src';
export const vg = createAPIContext();

// make API accessible for console debugging
Object.assign(self, { vg });

// enable query interface on global this (window)
Object.assign(self, {
  query: async (sql: string) => {
    const bytes = await vg.coordinator().databaseConnector()!.query({
      type: 'arrow',
      sql
    });
    return decodeIPC(bytes).toArray();
  }
});

export const { coordinator, namedPlots } = vg.context;

export function clear() {
  coordinator.clear();
  namedPlots.clear();
}

let wasm: DuckDBWASMConnector | undefined;

export async function setDatabaseConnector(type: 'rest' | 'rest_https' | 'wasm') {
  let connector;
  switch (type) {
    case 'rest':
      connector = new RestConnector();
      break;
    case 'rest_https':
      connector = new RestConnector({ uri: 'https://localhost:3000/' });
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
  coordinator.databaseConnector(connector);
}

async function installDatasketches(connector: Connector) {
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
