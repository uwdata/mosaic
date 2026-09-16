import { Coordinator, decodeIPC, DuckDBWASMConnector, RestConnector, SocketConnector } from '@uwdata/mosaic-core';
import { clickHouseCodeGenerator, duckDBCodeGenerator } from '@uwdata/mosaic-sql';
import { createAPIContext } from '@uwdata/vgplot';
import { ClickHouseConnector } from './clickhouse/connector.js';

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

export function setDatabaseConnector(type) {
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
    case 'clickhouse':
      connector = new ClickHouseConnector();
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
  clear();
  coordinator = new Coordinator(connector, {
    codegen: type === 'clickhouse' ? clickHouseCodeGenerator : duckDBCodeGenerator,
    preagg: { enabled: type !== 'clickhouse' }
  });
  vg = createAPIContext({ coordinator });
  namedPlots = vg.context.namedPlots;
  Object.assign(self, { vg });
}
