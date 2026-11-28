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

  it('renders custom header labels', async () => {
    const mc = new Coordinator(await NodeConnector.make(), { logger: null });
    await mc.exec('CREATE TABLE t AS SELECT 1 AS a, 2 AS b, 3 AS c');

    const label = document.createElement('em');
    label.textContent = 'Column C';
    const table = new Table({ from: 't', header: { a: 'Column A', c: label } });
    mc.connect(table);
    await vi.waitFor(() => expect(table.initialized).toBe(true));

    const ths = [...table.element.querySelectorAll('th')];
    expect(ths.map(th => th.textContent)).toEqual(['Column A', 'b', 'Column C']);
    expect(ths[2].querySelector('em')).toBe(label);

    mc.clear();
  });

  it('renders SVG element header labels', async () => {
    const mc = new Coordinator(await NodeConnector.make(), { logger: null });
    await mc.exec('CREATE TABLE t AS SELECT 1 AS a');

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const table = new Table({ from: 't', header: { a: icon } });
    mc.connect(table);
    await vi.waitFor(() => expect(table.initialized).toBe(true));

    expect(table.element.querySelector('th svg')).toBe(icon);

    mc.clear();
  });

  it('falls back to the column name for nullish header labels', async () => {
    const mc = new Coordinator(await NodeConnector.make(), { logger: null });
    await mc.exec('CREATE TABLE t AS SELECT 1 AS a, 2 AS b, 3 AS c');

    const table = new Table({ from: 't', header: { a: undefined, b: null, c: '' } });
    mc.connect(table);
    await vi.waitFor(() => expect(table.initialized).toBe(true));

    const ths = [...table.element.querySelectorAll('th')];
    expect(ths.map(th => th.textContent)).toEqual(['a', 'b', '']);

    mc.clear();
  });

  it('shows column names that match object prototype keys', async () => {
    const mc = new Coordinator(await NodeConnector.make(), { logger: null });
    await mc.exec('CREATE TABLE t AS SELECT 1 AS "constructor", 2 AS "toString"');

    const table = new Table({ from: 't' });
    mc.connect(table);
    await vi.waitFor(() => expect(table.initialized).toBe(true));

    const ths = [...table.element.querySelectorAll('th')];
    expect(ths.map(th => th.textContent)).toEqual(['constructor', 'toString']);

    mc.clear();
  });

  it('sorts by the underlying column when a relabeled header is clicked', async () => {
    const mc = new Coordinator(await NodeConnector.make(), { logger: null });
    await mc.exec('CREATE TABLE t AS SELECT * FROM (VALUES (2, 9), (3, 7), (1, 8)) v(x, y)');

    const table = new Table({ from: 't', header: { x: 'Label X' } });
    mc.connect(table);
    await vi.waitFor(() => expect(table.initialized).toBe(true));

    const firstColumn = () => [...table.body.querySelectorAll('tr')]
      .map(tr => tr.cells[0].innerText);
    const th = table.element.querySelector('th');

    th.click();
    await vi.waitFor(() => expect(firstColumn()).toEqual(['1', '2', '3']));
    expect(th.textContent).toBe('▴Label X');

    th.click();
    await vi.waitFor(() => expect(firstColumn()).toEqual(['3', '2', '1']));
    expect(th.textContent).toBe('▾Label X');

    mc.clear();
  });
});
