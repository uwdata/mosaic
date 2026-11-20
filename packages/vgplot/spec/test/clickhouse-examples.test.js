// @vitest-environment jsdom
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from 'node:net';
import { ClickHouseConnector, Coordinator } from '@uwdata/mosaic-core';
import { clickHouseCodeGenerator } from '@uwdata/mosaic-sql';
import { createAPIContext } from '@uwdata/vgplot';
import { astToDOM, parseSpec } from '../src/index.js';
import { clientsReady } from '../../vgplot/test/util/clients-ready.js';
import { loadSpec } from './load-specs.js';
import { clickhouseDatabase, clickhouseSupports, clickhouseUnsupported } from '../../../../dev/clickhouse/examples.mjs';
import { exampleNames, loadClickHouseExample } from '../../../../dev/clickhouse/fixtures.mjs';
import { startClickHouse } from '../../../../dev/clickhouse/server.mjs';

const enabled = process.env.CLICKHOUSE_EXAMPLES === '1';

describe.skipIf(!enabled)('gallery examples on ClickHouse', () => {
  let port;
  let server;

  beforeAll(async () => {
    stubRendering();
    port = await freePort();
    server = await startClickHouse({ port });
  });

  afterAll(() => server?.stop());

  for (const name of exampleNames) {
    const test = clickhouseSupports(name) ? it : it.fails;
    const reason = clickhouseUnsupported[name];
    test(reason ? `${name} (unsupported: ${reason})` : name, async () => {
      await loadClickHouseExample(name, server.query);

      const errors = [];
      const coordinator = new Coordinator(
        new ClickHouseConnector({
          uri: `http://127.0.0.1:${port}/`,
          user: 'demo',
          database: clickhouseDatabase(name)
        }),
        {
          codegen: clickHouseCodeGenerator,
          preagg: { enabled: false },
          logger: { ...silentLogger, error: error => errors.push(error) }
        }
      );

      const spec = await loadSpec(name);
      spec.data = Object.fromEntries(
        Object.keys(spec.data ?? {}).map(table => [table, { type: 'table' }])
      );
      const { element } = await astToDOM(parseSpec(spec), {
        api: createAPIContext({ coordinator })
      });
      const results = await clientsReady(/** @type {HTMLElement} */ (element));
      for (const result of results) {
        if (result.status === 'rejected') errors.push(result.reason);
      }
      expect(errors).toEqual([]);
    });
  }
});

const silentLogger = {
  debug() {}, info() {}, log() {}, warn() {}, error() {},
  group() {}, groupCollapsed() {}, groupEnd() {}
};

// jsdom has no canvas, which raster marks and color legends draw to,
// and no SVG length properties, which region brushes read.
function stubRendering() {
  const context = new Proxy({}, {
    get: (target, key) => key in target ? target[key] : (x, y, w = 1, h = 1) => ({
      data: new Uint8ClampedArray(w * h * 4), width: w, height: h
    })
  });
  HTMLCanvasElement.prototype.getContext = /** @type {any} */ (() => context);
  HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
  for (const dim of ['width', 'height']) {
    Object.defineProperty(SVGSVGElement.prototype, dim, {
      get() { return { baseVal: { value: Number(this.getAttribute(dim)) } }; }
    });
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = /** @type {import('node:net').AddressInfo} */ (server.address());
      server.close(() => resolve(port));
    });
  });
}
