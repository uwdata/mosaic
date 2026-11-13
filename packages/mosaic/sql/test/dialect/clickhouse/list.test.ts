import { expect, describe, it } from 'vitest';
import {
  Query, add, clickHouseCodeGenerator, column, list, listContains, listHasAll, listHasAny, unnest
} from '../../../src/index.js';

const gen = clickHouseCodeGenerator;

describe('ClickHouse list overrides', () => {
  it('rewrites listContains', () => {
    expect(listContains(column('xs'), 'x').toString(gen))
      .toBe('has("xs", \'x\')');
  });

  it('rewrites listHasAny', () => {
    expect(listHasAny(column('xs'), column('ys')).toString(gen))
      .toBe('hasAny("xs", "ys")');
  });

  it('rewrites listHasAll', () => {
    expect(listHasAll(column('xs'), column('ys')).toString(gen))
      .toBe('hasAll("xs", "ys")');
  });

  it('renders unnest', () => {
    expect(unnest('xs').toString(gen)).toBe('UNNEST("xs")');
  });

  it('rejects recursive unnest', () => {
    expect(() => unnest('xs', true).toString(gen))
      .toThrow(/Recursive UNNEST is not supported/);
    expect(() => unnest('xs', false, 2).toString(gen))
      .toThrow(/Recursive UNNEST is not supported/);
  });
});

describe('ClickHouse multiple UNNEST overrides', () => {
  it('zips equal-length list literals with arrayZip', () => {
    const q = Query.select({ a: unnest(list([1, 2])), b: unnest(list([3, 4])) });
    expect(q.toString(gen)).toBe(
      'SELECT "__clickhouse_alias_0" AS "a", "__clickhouse_alias_1" AS "b" '
      + 'FROM (SELECT tupleElement(arrayJoin(arrayZip([1, 2], [3, 4])) AS "__clickhouse_unnest", 1) '
      + 'AS "__clickhouse_alias_0", tupleElement("__clickhouse_unnest", 2) AS "__clickhouse_alias_1")'
    );
  });

  it('zips other lists with arrayZipUnaligned, including UNNESTs inside expressions', () => {
    const q = Query.select({ a: add(unnest('xs'), 1), b: unnest('ys') }).from('t');
    expect(q.toString(gen)).toBe(
      'SELECT "__clickhouse_alias_0" AS "a", "__clickhouse_alias_1" AS "b" '
      + 'FROM (SELECT (tupleElement(arrayJoin(arrayZipUnaligned("xs", "ys")) AS "__clickhouse_unnest", 1) + 1) '
      + 'AS "__clickhouse_alias_0", tupleElement("__clickhouse_unnest", 2) AS "__clickhouse_alias_1" FROM "t")'
    );
  });

  it('zips identical lists once', () => {
    const q = Query.select({ a: unnest('xs'), b: unnest('ys'), c: unnest('xs') }).from('t');
    expect(q.toString(gen)).toBe(
      'SELECT "__clickhouse_alias_0" AS "a", "__clickhouse_alias_1" AS "b", "__clickhouse_alias_2" AS "c" '
      + 'FROM (SELECT tupleElement(arrayJoin(arrayZipUnaligned("xs", "ys")) AS "__clickhouse_unnest", 1) '
      + 'AS "__clickhouse_alias_0", tupleElement("__clickhouse_unnest", 2) AS "__clickhouse_alias_1", '
      + 'tupleElement("__clickhouse_unnest", 1) AS "__clickhouse_alias_2" FROM "t")'
    );
    expect(Query.select({ a: unnest('xs'), b: unnest('xs') }).from('t').toString(gen))
      .toBe('SELECT UNNEST("xs") AS "a", UNNEST("xs") AS "b" FROM "t"');
  });

  it('rejects UNNEST outside the select list', () => {
    const q = Query.select({ a: unnest('xs'), b: unnest('ys') }).from('t').orderby(unnest('ys'));
    expect(() => q.toString(gen))
      .toThrow(/UNNEST outside the select list cannot be combined with multiple UNNESTs/);
  });

  it('rejects recursive UNNEST', () => {
    const q = Query.select({ a: unnest('xs', true), b: unnest('ys') }).from('t');
    expect(() => q.toString(gen)).toThrow(/Recursive UNNEST is not supported/);
  });

  it('rejects star projections', () => {
    const q = Query.select('*', { a: unnest('xs'), b: unnest('ys') }).from('t');
    expect(() => q.toString(gen))
      .toThrow(/Star projections cannot be combined with shadowing aliases or multiple UNNESTs/);
  });
});
