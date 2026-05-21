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
    const query = Query.pivot('sales');

    expect(query).toBeInstanceOf(PivotQuery);
    expect(query.type).toBe('PIVOT_QUERY');
    expect(isQuery(query)).toBe(true);
    expect(isPivotQuery(query)).toBe(true);
  });

  it('identifies only pivot queries with the pivot type guard', () => {
    expect(isPivotQuery(Query.pivot('sales'))).toBe(true);
    expect(isPivotQuery(Query.select('*').from('sales'))).toBe(false);
    expect(isPivotQuery(null)).toBe(false);
    expect(isPivotQuery({ type: 'PIVOT_QUERY' })).toBe(false);
  });

  it('stores table name sources as SQL AST nodes', () => {
    const query = Query.pivot('sales');

    expect(isTableRef(query.source)).toBe(true);
    expect(`${query.source}`).toBe('"sales"');
  });

  it('accepts existing SQL nodes as pivot sources', () => {
    const source = sql`SELECT * FROM sales`;
    const query = Query.pivot(source);

    expect(query.source).toBe(source);
  });

  it('adds ON expressions from string column names', () => {
    const query = Query.pivot('sales').on('year');

    expect(query._on).toHaveLength(1);
    expect(isColumnRef(query._on[0])).toBe(true);
    expect(`${query._on[0]}`).toBe('"year"');
    expect(query.toString()).toBe('PIVOT "sales" ON "year"');
  });

  it('adds multiple ON expressions in caller-supplied order', () => {
    const query = Query.pivot('sales').on('year', 'quarter');

    expect(query._on.map(String)).toEqual(['"year"', '"quarter"']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year", "quarter"');
  });

  it('adds array ON expressions in caller-supplied order', () => {
    const query = Query.pivot('sales').on(['year', 'quarter']);

    expect(query._on.map(String)).toEqual(['"year"', '"quarter"']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year", "quarter"');
  });

  it('appends ON expressions from repeated calls', () => {
    const query = Query.pivot('sales').on('year').on('quarter');

    expect(query._on.map(String)).toEqual(['"year"', '"quarter"']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year", "quarter"');
  });

  it('preserves existing AST expression inputs for ON expressions', () => {
    const expr = add(column('year'), 1);
    const query = Query.pivot('sales').on(expr);

    expect(query._on).toEqual([expr]);
    expect(query.toString()).toBe('PIVOT "sales" ON ("year" + 1)');
  });

  it('adds IN values as SQL literals', () => {
    const query = Query.pivot('sales').on('year').in(2020, 2021);

    expect(query._in.map(String)).toEqual(['2020', '2021']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year" IN (2020, 2021)');
  });

  it('renders string IN values as SQL string literals', () => {
    const query = Query.pivot('sales').on('quarter').in('Q1', 'Q2');

    expect(query._in.map(String)).toEqual([`'Q1'`, `'Q2'`]);
    expect(query.toString()).toBe(`PIVOT "sales" ON "quarter" IN ('Q1', 'Q2')`);
  });

  it('preserves existing AST expression inputs for IN values', () => {
    const expr = literal('Q1');
    const query = Query.pivot('sales').on('quarter').in(expr);

    expect(query._in).toEqual([expr]);
    expect(query.toString()).toBe(`PIVOT "sales" ON "quarter" IN ('Q1')`);
  });

  it('appends IN values from repeated calls in caller-supplied order', () => {
    const query = Query.pivot('sales').on('year').in(2020).in(2021, 2022);

    expect(query._in.map(String)).toEqual(['2020', '2021', '2022']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year" IN (2020, 2021, 2022)');
  });

  it('adds an unaliased USING aggregate expression', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount'));

    expect(query._using).toHaveLength(1);
    expect(query._using[0].alias).toBe('');
    expect(`${query._using[0].expr}`).toBe('sum("amount")');
    expect(query.toString()).toBe('PIVOT "sales" ON "year" USING sum("amount")');
  });

  it('adds an aliased USING aggregate expression', () => {
    const query = Query.pivot('sales').on('year').using({ total: sum('amount') });

    expect(query._using).toHaveLength(1);
    expect(query._using[0].alias).toBe('total');
    expect(`${query._using[0].expr}`).toBe('sum("amount")');
    expect(query.toString()).toBe('PIVOT "sales" ON "year" USING sum("amount") AS "total"');
  });

  it('adds multiple USING expressions in caller-supplied order', () => {
    const query = Query
      .pivot('sales')
      .on('year')
      .using(sum('amount'), { total_units: sum('units') })
      .using({ total_cost: sum('cost') });

    expect(query._using.map(node => node.alias)).toEqual(['', 'total_units', 'total_cost']);
    expect(query.toString()).toBe(
      'PIVOT "sales" ON "year" USING sum("amount"), sum("units") AS "total_units", sum("cost") AS "total_cost"'
    );
  });

  it('adds GROUP BY expressions from string column names', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount')).groupby('region');

    expect(query._groupby).toHaveLength(1);
    expect(isColumnRef(query._groupby[0])).toBe(true);
    expect(`${query._groupby[0]}`).toBe('"region"');
    expect(query.toString()).toBe('PIVOT "sales" ON "year" USING sum("amount") GROUP BY "region"');
  });

  it('preserves existing AST expression inputs for GROUP BY expressions', () => {
    const expr = add(column('year'), 1);
    const query = Query.pivot('sales').on('quarter').using(sum('amount')).groupby(expr);

    expect(query._groupby).toEqual([expr]);
    expect(query.toString()).toBe('PIVOT "sales" ON "quarter" USING sum("amount") GROUP BY ("year" + 1)');
  });

  it('adds multiple GROUP BY expressions in caller-supplied order', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount')).groupby('region', 'segment');

    expect(query._groupby.map(String)).toEqual(['"region"', '"segment"']);
    expect(query.toString()).toBe(
      'PIVOT "sales" ON "year" USING sum("amount") GROUP BY "region", "segment"'
    );
  });

  it('adds array GROUP BY expressions in caller-supplied order', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount')).groupby(['region', 'segment']);

    expect(query._groupby.map(String)).toEqual(['"region"', '"segment"']);
    expect(query.toString()).toBe(
      'PIVOT "sales" ON "year" USING sum("amount") GROUP BY "region", "segment"'
    );
  });

  it('appends GROUP BY expressions from repeated calls', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount')).groupby('region').groupby('segment');

    expect(query._groupby.map(String)).toEqual(['"region"', '"segment"']);
    expect(query.toString()).toBe(
      'PIVOT "sales" ON "year" USING sum("amount") GROUP BY "region", "segment"'
    );
  });

  it('sets GROUP BY expressions by replacing prior pivot groups', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount')).groupby('region').setGroupby('segment');

    expect(query._groupby.map(String)).toEqual(['"segment"']);
    expect(query.toString()).toBe('PIVOT "sales" ON "year" USING sum("amount") GROUP BY "segment"');
  });

  it('keeps existing SQL output shape when no IN values are provided', () => {
    expect(Query.pivot('sales').toString()).toBe('PIVOT "sales"');
    expect(Query.pivot('sales').on('year').toString()).toBe('PIVOT "sales" ON "year"');
  });

  it('renders common table expressions from with-pivot helpers', () => {
    const source = Query.select('*').from('raw_sales');
    const pivot = Query
      .with({ sales: source })
      .pivot('sales')
      .on('year')
      .using(sum('amount'));

    expect(pivot.toString()).toBe(
      'WITH "sales" AS (SELECT * FROM "raw_sales") PIVOT "sales" ON "year" USING sum("amount")'
    );
  });

  it('renders common table expressions added directly to pivot queries', () => {
    const pivot = Query
      .pivot('sales')
      .with({ sales: Query.select('*').from('raw_sales') })
      .on('year')
      .using(sum('amount'));

    expect(pivot.toString()).toBe(
      'WITH "sales" AS (SELECT * FROM "raw_sales") PIVOT "sales" ON "year" USING sum("amount")'
    );
  });

  it('renders ORDER BY clauses added to pivot queries', () => {
    const pivot = Query
      .pivot('sales')
      .on('year')
      .using(sum('amount'))
      .groupby('region')
      .orderby('year');

    expect(pivot.toString()).toBe(
      'PIVOT "sales" ON "year" USING sum("amount") GROUP BY "region" ORDER BY "year"'
    );
  });

  it('rejects empty IN calls', () => {
    const query = Query.pivot('sales').on('year');

    expect(() => (query.in as (...expr: unknown[]) => PivotQuery)()).toThrow(
      'PivotQuery.in requires at least one value.'
    );
    expect(query.toString()).toBe('PIVOT "sales" ON "year"');
  });

  it('clones IN values without aliasing mutable clause arrays', () => {
    const query = Query.pivot('sales').on('year').in(2020);
    const clone = query.clone();

    query.on('quarter').in(2021);

    expect(clone.toString()).toBe('PIVOT "sales" ON "year" IN (2020)');
    expect(clone._on).not.toBe(query._on);
    expect(clone._in).not.toBe(query._in);
  });

  it('clones USING expressions without aliasing mutable clause arrays', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount'));
    const clone = query.clone();

    query.using({ total_units: sum('units') });

    expect(clone.toString()).toBe('PIVOT "sales" ON "year" USING sum("amount")');
    expect(clone._using).not.toBe(query._using);
  });

  it('clones GROUP BY expressions without aliasing mutable clause arrays', () => {
    const query = Query.pivot('sales').on('year').using(sum('amount')).groupby('region');
    const clone = query.clone();

    query.groupby('segment');

    expect(clone.toString()).toBe('PIVOT "sales" ON "year" USING sum("amount") GROUP BY "region"');
    expect(clone._groupby).not.toBe(query._groupby);
  });

  it('clones inherited clause arrays without aliasing mutable state', () => {
    const query = Query
      .pivot('sales')
      .with({ sales: Query.select('*').from('raw_sales') })
      .orderby('year');
    const clone = query.clone();

    expect(clone.toString()).toBe(query.toString());
    expect(clone._with).not.toBe(query._with);
    expect(clone._orderby).not.toBe(query._orderby);
  });

  it('deep clones pivot ON and IN expression nodes', () => {
    const query = Query.pivot('sales').on(add(column('year'), 1)).in(literal('Q1'));
    const clone = deepClone(query);

    expect(clone.toString()).toBe(query.toString());
    expect(clone._on).not.toBe(query._on);
    expect(clone._in).not.toBe(query._in);
    expect(clone._on[0]).not.toBe(query._on[0]);
    expect(clone._in[0]).not.toBe(query._in[0]);
  });

  it('deep clones pivot USING expression nodes', () => {
    const query = Query.pivot('sales').using(sum('amount'));
    const clone = deepClone(query);

    expect(clone.toString()).toBe(query.toString());
    expect(clone._using).not.toBe(query._using);
    expect(clone._using[0]).not.toBe(query._using[0]);
    expect(clone._using[0].expr).not.toBe(query._using[0].expr);
  });

  it('deep clones pivot GROUP BY expression nodes', () => {
    const query = Query.pivot('sales').groupby(add(column('year'), 1));
    const clone = deepClone(query);

    expect(clone.toString()).toBe(query.toString());
    expect(clone._groupby).not.toBe(query._groupby);
    expect(clone._groupby[0]).not.toBe(query._groupby[0]);
  });

  it('can be used as a select query source', () => {
    const pivot = Query.pivot('sales');
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    expect(query.toString()).toBe('SELECT * FROM (PIVOT "sales") AS "p"');
  });

  it('can be used as a select query source with pivot clauses', () => {
    const pivot = Query.pivot('sales').on('year');
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    expect(query.toString()).toBe('SELECT * FROM (PIVOT "sales" ON "year") AS "p"');
  });

  it('can be used as a select query source with IN values', () => {
    const pivot = Query.pivot('sales').on('year').in(2020, 2021);
    const query = Query.select('*').from({ p: pivot });
    const [source] = query._from;

    expect(isSelectQuery(query)).toBe(true);
    expect(source).toBeInstanceOf(FromClauseNode);
    expect((source as FromClauseNode).expr).toBe(pivot);
    expect(query.toString()).toBe('SELECT * FROM (PIVOT "sales" ON "year" IN (2020, 2021)) AS "p"');
  });

  it('can be used as a select query source with USING expressions', () => {
    const pivot = Query.pivot('sales').on('year').in(2020, 2021).using({ total: sum('amount') });
    const query = Query.select('*').from({ p: pivot });

    expect(query.toString()).toBe(
      'SELECT * FROM (PIVOT "sales" ON "year" IN (2020, 2021) USING sum("amount") AS "total") AS "p"'
    );
  });

  it('can be used as a select query source with GROUP BY expressions', () => {
    const pivot = Query.pivot('sales').on('year').using({ total: sum('amount') }).groupby('region');
    const query = Query.select('*').from({ p: pivot });

    expect(query.toString()).toBe(
      'SELECT * FROM (PIVOT "sales" ON "year" USING sum("amount") AS "total" GROUP BY "region") AS "p"'
    );
  });
});
