// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { Coordinator, coordinator } from '@uwdata/mosaic-core';
import { NodeConnector } from '@uwdata/mosaic-core/node-connector';
import { Table } from '../src/Table.js';

describe('Table', () => {
  it('prefetches using its own coordinator', async () => {
    const global = coordinator();
    const globalPrefetch = vi.spyOn(global, 'prefetch');

    const mc = new Coordinator(await NodeConnector.make(), { logger: null });
    await mc.exec('CREATE TABLE t AS SELECT range AS x FROM range(500)');
    const prefetch = vi.spyOn(mc, 'prefetch');

    const table = new Table({ from: 't', rowBatch: 100 });
    mc.connect(table);
    await vi.waitFor(() => expect(table.initialized).toBe(true));

    table.requestData(100);
    expect(prefetch).toHaveBeenCalledTimes(1);
    expect(String(prefetch.mock.calls[0][0])).toContain('OFFSET 200');
    expect(globalPrefetch).not.toHaveBeenCalled();

    mc.clear();
  });

  it('does not throw when requesting data after disconnect', async () => {
    const mc = new Coordinator(await NodeConnector.make(), { logger: null });
    await mc.exec('CREATE TABLE t AS SELECT range AS x FROM range(10)');

    const table = new Table({ from: 't' });
    mc.connect(table);
    await vi.waitFor(() => expect(table.initialized).toBe(true));
    table.destroy();

    expect(() => table.requestData(100)).not.toThrow();
  });
});
