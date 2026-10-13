import { expect, describe, it } from 'vitest';
import { columns as collected } from './util/columns.js';
import { add, collectColumns, column, columns, deepClone, greatest, isColumnRef, lambda, max, prefix, Query, rewrite, star, StarNode } from '../src/index.js';

describe('star', () => {
  it('generates plain and qualified stars', async () => {
    await expect(Query.select(star()).from('t1')).toBeValidQuery('SELECT * FROM "t1"');
    await expect(Query.select(star('t1')).from('t1')).toBeValidQuery('SELECT "t1".* FROM "t1"');
  });

  it('does not alias qualified column stars', async () => {
    await expect(Query.select(column('*', 't1')).from('t1')).toBeValidQuery('SELECT "t1".* FROM "t1"');
  });

  it('generates star modifiers', async () => {
    const s = star(null, {
      exclude: ['num1'],
      replace: { num2: add('num2', 1) },
      rename: { num3: 'n3' }
    });
    await expect(Query.select(s).from('t1')).toBeValidQuery(
      'SELECT * EXCLUDE ("num1") REPLACE (("num2" + 1) AS "num2") RENAME ("num3" AS "n3") FROM "t1"'
    );
    await expect(Query.select(star('t1', { exclude: ['num1', 'num2'] })).from('t1'))
      .toBeValidQuery('SELECT "t1".* EXCLUDE ("num1", "num2") FROM "t1"');
  });

  it('is a column reference to all columns', () => {
    const s = star(null, { exclude: ['num1'] });
    expect(isColumnRef(s)).toBe(true);
    expect(s.column).toBe('*');
    expect(collected(s)).toStrictEqual(['*']);
  });

  it('collects columns referenced by replacements', () => {
    const s = star(null, { exclude: ['txt1'], replace: { num2: add('num2', column('num3')) } });
    expect(collected(s)).toStrictEqual(['*', 'num2', 'num3']);
  });

  it('supports cloning and rewriting', () => {
    const num3 = column('num3');
    const s = star(null, { replace: { num2: add('num2', num3) } });
    const clone = deepClone(s);
    expect(clone).toBeInstanceOf(StarNode);
    expect(clone.replace[0]).not.toBe(s.replace[0]);
    expect(`${clone}`).toBe(`${s}`);
    const map = new Map([[num3, column('num1')]]);
    expect(`${rewrite(s, map)}`).toBe('* REPLACE (("num2" + "num1") AS "num2")');
  });
});

describe('columns', () => {
  it('selects columns by regular expression', async () => {
    const expr = columns('^num[12]$');
    await expect(expr).toBeValidExpr('COLUMNS(\'^num[12]$\')');
    expect(collected(expr)).toStrictEqual(['*']);
  });

  it('selects columns by name', async () => {
    const expr = columns(['num1', 'txt1']);
    await expect(expr).toBeValidExpr('COLUMNS([\'num1\', \'txt1\'])');
    expect(collected(expr)).toStrictEqual(['num1', 'txt1']);
  });

  it('selects columns by lambda', async () => {
    const expr = columns(lambda('c', c => prefix(c, 'num')));
    await expect(expr).toBeValidExpr('COLUMNS(lambda "c": starts_with("c", \'num\'))');
    expect(collected(expr)).toStrictEqual(['*']);
  });

  it('selects columns by star', async () => {
    const expr = columns(star(null, { exclude: ['txt1'] }));
    await expect(expr).toBeValidExpr('COLUMNS(* EXCLUDE ("txt1"))');
    expect(collectColumns(expr).map(String)).toStrictEqual(['* EXCLUDE ("txt1")']);
  });

  it('supports aggregates and unpacking', async () => {
    await expect(max(columns(['num1', 'num2']))).toBeValidExpr('max(COLUMNS([\'num1\', \'num2\']))');
    await expect(greatest(columns(['num1', 'num2'], true)))
      .toBeValidExpr('greatest(*COLUMNS([\'num1\', \'num2\']))');
  });
});

describe('COLUMNS select clauses', () => {
  it('do not apply derived aliases to expanding expressions', async () => {
    await expect(Query.select(columns('^num[12]$')).from('t1'))
      .toBeValidQuery('SELECT COLUMNS(\'^num[12]$\') FROM "t1"');
  });

  it('keep explicit aliases', async () => {
    await expect(Query.select({ m: max(columns(['num1', 'num2'])) }).from('t1'))
      .toBeValidQuery('SELECT max(COLUMNS([\'num1\', \'num2\'])) AS "m" FROM "t1"');
  });
});
