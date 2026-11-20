import { expect, describe, it } from 'vitest';
import { stubParam } from './util/stub-param.js';
import { Query, column, isParamLike, sql } from '../src/index.js';
import { columns, params } from './util/columns.js';

describe('sql expression', () => {
  it('creates basic SQL expressions', async () => {
    const expr = sql`1 + 1`;
    await expect(expr).toBeValidExpr('1 + 1');
    expect(columns(expr)).toEqual([]);
    expect(params(expr)).toEqual([]);
  });

  it('creates interpolated SQL expressions', async () => {
    const expr = sql`${column('num1')} * ${column('num2')}`;
    await expect(expr).toBeValidExpr('"num1" * "num2"');
    expect(columns(expr)).toEqual(['num1', 'num2']);
    expect(params(expr)).toEqual([]);
  });

  it('creates nested SQL expressions', async () => {
    const base = sql`${column('num1')} * 4`;
    const expr = sql`${base} + 1`;
    await expect(expr).toBeValidExpr('"num1" * 4 + 1');
    expect(columns(expr)).toEqual(['num1']);
    expect(params(expr)).toEqual([]);
  });

  it('creates parameterized SQL expressions', async () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const expr = sql`${column('num1')} * ${param}`;
    await expect(expr).toBeValidExpr('"num1" * 4');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['num1']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    await expect(expr).toBeValidExpr('"num1" * 5');
  });

  it('creates nested parameterized SQL expressions', async () => {
    const param = stubParam(4);
    expect(isParamLike(param)).toBe(true);

    const base = sql`${column('num1')} * ${param}`;
    const expr = sql`${base} + 1`;
    await expect(expr).toBeValidExpr('"num1" * 4 + 1');
    expect(isParamLike(expr)).toBe(false);
    expect(columns(expr)).toEqual(['num1']);
    expect(params(expr)).toEqual([param]);

    param.update(5);
    await expect(expr).toBeValidExpr('"num1" * 5 + 1');
  });
});

describe('sql expression with a line comment', () => {
  it('keeps a following alias and select entry', async () => {
    const query = Query
      .from('t1')
      .select({ y: sql`num1 -- a note`, d: 'txt2' });
    await expect(query).toBeValidQuery(
      'SELECT num1 -- a note\n AS "y", "txt2" AS "d" FROM "t1"'
    );
  });

  it('keeps a following FROM clause', async () => {
    const query = Query
      .from('t1')
      .select({ d: 'txt2', y: sql`num1 -- a note` });
    await expect(query).toBeValidQuery(
      'SELECT "txt2" AS "d", num1 -- a note\n AS "y" FROM "t1"'
    );
  });

  it('keeps a following GROUP BY clause', async () => {
    const query = Query
      .from('t1')
      .select('num1')
      .where(sql`num1 > 5 -- keep positives`)
      .groupby('num1');
    await expect(query).toBeValidQuery(
      'SELECT "num1" FROM "t1" WHERE num1 > 5 -- keep positives\n GROUP BY "num1"'
    );
  });

  it('does not add a second newline to a terminated comment', async () => {
    const query = Query
      .from('t1')
      .select({ y: sql`num1 -- a note\n`, d: 'txt2' });
    await expect(query).toBeValidQuery(
      'SELECT num1 -- a note\n AS "y", "txt2" AS "d" FROM "t1"'
    );
  });

  it('keeps a select entry following a string literal with dashes', async () => {
    const query = Query
      .from('t1')
      .select({ y: sql`txt1 || ' -- not a comment '`, d: 'txt2' });
    await expect(query).toBeValidQuery(
      'SELECT txt1 || \' -- not a comment \'\n AS "y", "txt2" AS "d" FROM "t1"'
    );
  });
});
