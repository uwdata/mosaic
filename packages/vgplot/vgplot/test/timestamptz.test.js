// @vitest-environment jsdom
import { expect, describe, it } from 'vitest';
import { Coordinator } from '@uwdata/mosaic-core';
import { createAPIContext, xScale } from '../src/index.js';
import { clientsReady } from './util/clients-ready.js';
import { NodeConnector } from '@uwdata/mosaic-core/node-connector';

async function xScaleType(columnType, ...attributes) {
  const mc = new Coordinator(await NodeConnector.make(), { logger: null });
  const vg = createAPIContext({ coordinator: mc });
  await mc.exec(`CREATE TABLE data AS SELECT
    ${columnType} '2029-01-01 00:00:00' + INTERVAL (6 * v) HOUR AS datetime,
    v AS value
  FROM generate_series(0, 3) AS t(v)`);
  const el = vg.plot(
    vg.lineY(vg.from('data'), { x: 'datetime', y: 'value' }),
    ...attributes
  );
  await clientsReady(el);
  return el.firstChild.scale('x').type;
}

describe('timestamptz scales', () => {
  it('renders TIMESTAMPTZ columns on a local time scale', async () => {
    expect(await xScaleType('TIMESTAMPTZ')).toBe('time');
  });

  it('renders naive TIMESTAMP columns on a UTC scale', async () => {
    expect(await xScaleType('TIMESTAMP')).toBe('utc');
  });

  it('respects an explicit scale type', async () => {
    expect(await xScaleType('TIMESTAMPTZ', xScale('utc'))).toBe('utc');
  });
});
