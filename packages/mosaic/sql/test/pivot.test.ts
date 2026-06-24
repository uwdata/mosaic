import { expect, describe, it } from 'vitest';
import {
  add,
  column,
  deepClone,
  FromClauseNode,
  isColumnRef,
  isPivotQuery,
  isQuery,
  isSelectQuery,
  isTableRef,
  literal,
  PivotQuery,
  Query,
  sql,
  sum
} from '../src/index.js';

describe('PivotQuery', () => {
  it('constructs a pivot query from a table name', () => {
    const query = Query.pivot('t1');

    expect(query).toBeInstanceOf(PivotQuery);
    expect(query.type).toBe('PIVOT_QUERY');
    expect(isQuery(query)).toBe(true);
    expect(isPivotQuery(query)).toBe(true);
  });

  it('identifies only pivot queries with the pivot type guard', () => {
    expect(isPivotQuery(Query.pivot('t1'))).toBe(true);
    expect(isPivotQuery(Query.select('*').from('t1'))).toBe(false);
    expect(isPivotQuery(null)).toBe(false);
    expect(isPivotQuery({ type: 'PIVOT_QUERY' })).toBe(false);
  });

  it('stores table name sources as SQL AST nodes', () => {
    const query = Query.pivot('t1');

    expect(isTableRef(query.source)).toBe(true);
    expect(String(query.source)).toBe('"t1"');
  });

  it('accepts existing SQL nodes as pivot sources', () => {
    const source = sql`SELECT * FROM t1`;
    const query = Query.pivot(source);

    expect(query.source).toBe(source);
  });

  it('adds ON expressions from string column names', async () => {
    const query = Query.pivot('t1').on('int1');

    expect(query._on).toHaveLength(1);
    expect(isColumnRef(query._on[0])).toBe(true);
    expect(String(query._on[0])).toBe('"int1"');
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1"');
  });

  it('adds multiple ON expressions in caller-supplied order', async () => {
    const query = Query.pivot('t1').on('int1', 'txt1');

    expect(query._on.map(String)).toEqual(['"int1"', '"txt1"']);
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1", "txt1"');
  });

  it('adds array ON expressions in caller-supplied order', async () => {
    const query = Query.pivot('t1').on(['int1', 'txt1']);

    expect(query._on.map(String)).toEqual(['"int1"', '"txt1"']);
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1", "txt1"');
  });

  it('appends ON expressions from repeated calls', async () => {
    const query = Query.pivot('t1').on('int1').on('txt1');

    expect(query._on.map(String)).toEqual(['"int1"', '"txt1"']);
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1", "txt1"');
  });

  it('preserves existing AST expression inputs for ON expressions', async () => {
    const expr = add(column('int1'), 1);
    const query = Query.pivot('t1').on(expr);

    expect(query._on).toEqual([expr]);
    await expect(query).toBeValidQuery('PIVOT "t1" ON ("int1" + 1)');
  });

  it('adds IN values as SQL literals', async () => {
    const query = Query.pivot('t1').on('int1').in(2020, 2021);

    expect(query._in.map(String)).toEqual(['2020', '2021']);
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1" IN (2020, 2021)');
  });

  it('renders string IN values as SQL string literals', async () => {
    const query = Query.pivot('t1').on('txt1').in('Q1', 'Q2');

    expect(query._in.map(String)).toEqual([`'Q1'`, `'Q2'`]);
    await expect(query).toBeValidQuery(`PIVOT "t1" ON "txt1" IN ('Q1', 'Q2')`);
  });

  it('preserves existing AST expression inputs for IN values', async () => {
    const expr = literal('Q1');
    const query = Query.pivot('t1').on('txt1').in(expr);

    expect(query._in).toEqual([expr]);
    await expect(query).toBeValidQuery(`PIVOT "t1" ON "txt1" IN ('Q1')`);
  });

  it('appends IN values from repeated calls in caller-supplied order', async () => {
    const query = Query.pivot('t1').on('int1').in(2020).in(2021, 2022);

    expect(query._in.map(String)).toEqual(['2020', '2021', '2022']);
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1" IN (2020, 2021, 2022)');
  });

  it('adds an unaliased USING aggregate expression', async () => {
    const query = Query.pivot('t1').on('int1').using(sum('num1'));

    expect(query._using).toHaveLength(1);
    expect(query._using[0].alias).toBe('');
    expect(`${query._using[0].expr}`).toBe('sum("num1")');
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1" USING sum("num1")');
  });

  it('adds an aliased USING aggregate expression', async () => {
    const query = Query.pivot('t1').on('int1').using({ total: sum('num1') });

    expect(query._using).toHaveLength(1);
    expect(query._using[0].alias).toBe('total');
    expect(`${query._using[0].expr}`).toBe('sum("num1")');
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1" USING sum("num1") AS "total"');
  });

  it('adds multiple USING expressions in caller-supplied order', async () => {
    const query = Query
      .pivot('t1')
      .on('int1')
      .using(sum('num1'), { total_units: sum('num2') })
      .using({ total_cost: sum('num3') });

    expect(query._using.map(node => node.alias)).toEqual(['', 'total_units', 'total_cost']);
    await expect(query).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1"), sum("num2") AS "total_units", sum("num3") AS "total_cost"'
    );
  });

  it('adds GROUP BY expressions from string column names', async () => {
    const query = Query.pivot('t1').on('int1').using(sum('num1')).groupby('txt1');

    expect(query._groupby).toHaveLength(1);
    expect(isColumnRef(query._groupby[0])).toBe(true);
    expect(`${query._groupby[0]}`).toBe('"txt1"');
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt1"');
  });

  it('preserves existing AST expression inputs for GROUP BY expressions', () => {
    const expr = add(column('int1'), 1);
    const query = Query.pivot('t1').on('txt1').using(sum('num1')).groupby(expr);

    expect(query._groupby).toEqual([expr]);
    expect(String(query)).toBe('PIVOT "t1" ON "txt1" USING sum("num1") GROUP BY ("int1" + 1)');
    // Serialization only: GROUP BY does not support expressions in DuckDB
  });

  it('adds multiple GROUP BY expressions in caller-supplied order', async () => {
    const query = Query.pivot('t1').on('int1').using(sum('num1')).groupby('txt1', 'txt2');

    expect(query._groupby.map(String)).toEqual(['"txt1"', '"txt2"']);
    await expect(query).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt1", "txt2"'
    );
  });

  it('adds array GROUP BY expressions in caller-supplied order', async () => {
    const query = Query.pivot('t1').on('int1').using(sum('num1')).groupby(['txt1', 'txt2']);

    expect(query._groupby.map(String)).toEqual(['"txt1"', '"txt2"']);
    await expect(query).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt1", "txt2"'
    );
  });

  it('appends GROUP BY expressions from repeated calls', async () => {
    const query = Query.pivot('t1').on('int1').using(sum('num1')).groupby('txt1').groupby('txt2');

    expect(query._groupby.map(String)).toEqual(['"txt1"', '"txt2"']);
    await expect(query).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt1", "txt2"'
    );
  });

  it('sets GROUP BY expressions by replacing prior pivot groups', async () => {
    const query = Query.pivot('t1').on('int1').using(sum('num1')).groupby('txt1').setGroupby('txt2');

    expect(query._groupby.map(String)).toEqual(['"txt2"']);
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt2"');
  });

  it('keeps existing SQL output shape when no IN values are provided', async () => {
    expect(String(Query.pivot('t1'))).toBe('PIVOT "t1"');
    // Serialization only: a bare PIVOT with no ON clause is not executable.
    await expect(Query.pivot('t1').on('int1')).toBeValidQuery('PIVOT "t1" ON "int1"');
  });

  it('renders common table expressions from with-pivot helpers', async () => {
    const source = Query.select('*').from('t1');
    const pivot = Query
      .with({ sales: source })
      .pivot('sales')
      .on('int1')
      .using(sum('num1'));

    await expect(pivot).toBeValidQuery(
      'WITH "sales" AS (SELECT * FROM "t1") PIVOT "sales" ON "int1" USING sum("num1")'
    );
  });

  it('renders common table expressions added directly to pivot queries', async () => {
    const pivot = Query
      .pivot('sales')
      .with({ sales: Query.select('*').from('t1') })
      .on('int1')
      .using(sum('num1'));

    await expect(pivot).toBeValidQuery(
      'WITH "sales" AS (SELECT * FROM "t1") PIVOT "sales" ON "int1" USING sum("num1")'
    );
  });

  it('renders ORDER BY clauses added to pivot queries', async () => {
    const pivot = Query
      .pivot('t1')
      .on('int1')
      .using(sum('num1'))
      .groupby('txt1')
      .orderby('txt1');

    await expect(pivot).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt1" ORDER BY "txt1"'
    );
  });

  it('renders LIMIT and OFFSET clauses added to pivot queries', async () => {
    const pivot = Query
      .pivot('t1')
      .on('int1')
      .using(sum('num1'))
      .groupby('txt1')
      .orderby('txt1')
      .limit(10)
      .offset(20);

    await expect(pivot).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt1" ORDER BY "txt1" LIMIT 10 OFFSET 20'
    );
  });

  it('renders expression-valued LIMIT and OFFSET clauses added to pivot queries', async () => {
    const pivot = Query
      .pivot('t1')
      .on('int1')
      .using(sum('num1'))
      .limit(add(5, 5))
      .offset(add(10, 10));

    await expect(pivot).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1") LIMIT (5 + 5) OFFSET (10 + 10)'
    );
  });

  it('renders percentage LIMIT clauses added to pivot queries', async () => {
    const pivot = Query
      .pivot('t1')
      .on('int1')
      .using(sum('num1'))
      .limitPercent(10);

    await expect(pivot).toBeValidQuery(
      'PIVOT "t1" ON "int1" USING sum("num1") LIMIT 10%'
    );
  });

  it('rejects empty IN calls', async () => {
    const query = Query.pivot('t1').on('int1');

    expect(() => (query.in as (...expr: unknown[]) => PivotQuery)()).toThrow(
      'PivotQuery.in requires at least one value.'
    );
    await expect(query).toBeValidQuery('PIVOT "t1" ON "int1"');
  });

  it('clones IN values without aliasing mutable clause arrays', async () => {
    const query = Query.pivot('t1').on('int1').in(2020);
    const clone = query.clone();

    query.on('txt1').in(2021);

    await expect(clone).toBeValidQuery('PIVOT "t1" ON "int1" IN (2020)');
    expect(clone._on).not.toBe(query._on);
    expect(clone._in).not.toBe(query._in);
  });

  it('clones USING expressions without aliasing mutable clause arrays', async () => {
    const query = Query.pivot('t1').on('int1').using(sum('num1'));
    const clone = query.clone();

    query.using({ total_units: sum('num2') });

    await expect(clone).toBeValidQuery('PIVOT "t1" ON "int1" USING sum("num1")');
    expect(clone._using).not.toBe(query._using);
  });

  it('clones GROUP BY expressions without aliasing mutable clause arrays', async() => {
    const query = Query.pivot('t1').on('int1').using(sum('num1')).groupby('txt1');
    const clone = query.clone();

    query.groupby('txt2');

    await expect(clone).toBeValidQuery('PIVOT "t1" ON "int1" USING sum("num1") GROUP BY "txt1"');
    expect(clone._groupby).not.toBe(query._groupby);
  });

  it('clones inherited clause arrays without aliasing mutable state', () => {
    const query = Query
      .pivot('sales')
      .with({ sales: Query.select('*').from('t1') })
      .orderby('int1')
      .limit(10)
      .offset(20);
    const clone = query.clone();

    expect(String(clone)).toBe(String(query));
    expect(clone._with).not.toBe(query._with);
    expect(clone._orderby).not.toBe(query._orderby);
  });

  it('deep clones pivot ON and IN expression nodes', () => {
    const query = Query.pivot('t1').on(add(column('int1'), 1)).in(literal('Q1'));
    const clone = deepClone(query);

    expect(String(clone)).toBe(String(query));
    expect(clone._on).not.toBe(query._on);
    expect(clone._in).not.toBe(query._in);
    expect(clone._on[0]).not.toBe(query._on[0]);
    expect(clone._in[0]).not.toBe(query._in[0]);
  });

  it('deep clones pivot USING expression nodes', () => {
    const query = Query.pivot('t1').using(sum('num1'));
    const clone = deepClone(query);

    expect(String(clone)).toBe(String(query));
    expect(clone._using).not.toBe(query._using);
    expect(clone._using[0]).not.toBe(query._using[0]);
    expect(clone._using[0].expr).not.toBe(query._using[0].expr);
  });

  it('deep clones pivot GROUP BY expression nodes', () => {
    const query = Query.pivot('t1').groupby(add(column('int1'), 1));
    const clone = deepClone(query);

    expect(String(clone)).toBe(String(query));
    expect(clone._groupby).not.toBe(query._groupby);
    expect(clone._groupby[0]).not.toBe(query._groupby[0]);
  });

  it('can be used as a select query source', async () => {
    const pivot = Query.pivot('t1').on('int1');
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    await expect(query).toBeValidQuery('SELECT * FROM (PIVOT "t1" ON "int1") AS "p"');
  });

  it('can be used as a select query source with IN values', async () => {
    const pivot = Query.pivot('t1').on('int1').in(2020, 2021);
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    await expect(query).toBeValidQuery('SELECT * FROM (PIVOT "t1" ON "int1" IN (2020, 2021)) AS "p"');
  });

  it('can be used as a select query source with USING expressions', async () => {
    const pivot = Query.pivot('t1').on('int1').in(2020, 2021).using({ total: sum('num1') });
    const query = Query.select('*').from({ p: pivot });

    await expect(query).toBeValidQuery(
      'SELECT * FROM (PIVOT "t1" ON "int1" IN (2020, 2021) USING sum("num1") AS "total") AS "p"'
    );
  });

  it('can be used as a select query source with GROUP BY expressions', async () => {
    const pivot = Query.pivot('t1').on('int1').using({ total: sum('num1') }).groupby('txt1');
    const query = Query.select('*').from({ p: pivot });

    await expect(query).toBeValidQuery(
      'SELECT * FROM (PIVOT "t1" ON "int1" USING sum("num1") AS "total" GROUP BY "txt1") AS "p"'
    );
  });
});
