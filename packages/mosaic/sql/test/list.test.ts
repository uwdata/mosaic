import { expect, describe, it } from 'vitest';
import {literal, column} from '../src/index.js';
import { columns } from './util/columns.js';
import {list, list_contains, list_has_all, list_has_any} from "../src/functions/list";

describe('List functions', () => {
  it('include list_contains', () => {
    const expr = list_contains(column("foo"), literal('bar'))
    expect(String(expr)).toBe(`list_contains("foo", 'bar')`);
    expect(expr.name).toBe('list_contains');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include list_has_all', () => {
    const expr = list_has_all(column("foo"), list([literal('bar'), literal('baz')]))
    expect(String(expr)).toBe(`list_has_all("foo", ['bar', 'baz'])`);
    expect(expr.name).toBe('list_has_all');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });

  it('include list_has_any', () => {
    const expr = list_has_any(column("foo"), list([literal('bar'), literal('baz')]))
    expect(String(expr)).toBe(`list_has_any("foo", ['bar', 'baz'])`);
    expect(expr.name).toBe('list_has_any');
    expect(expr.args.length).toBe(2);
    expect(columns(expr)).toStrictEqual(['foo']);
  });
});
