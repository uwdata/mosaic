import { AggregateNode, Query, asTableRef, count, isNull, max, min, sql } from '@uwdata/mosaic-sql';
import { jsType } from './js-type.js';

export const Count = 'count';
export const Nulls = 'nulls';
export const Max = 'max';
export const Min = 'min';
export const Distinct = 'distinct';
export const Stats = { Count, Nulls, Max, Min, Distinct };

/**
 * @type {Record<string, (column: string) => AggregateNode>}
 */
const statMap = {
  [Count]: count,
  [Distinct]: column => count(column).distinct(),
  [Max]: max,
  [Min]: min,
  [Nulls]: column => count().where(isNull(column))
};

/**
 *
 * @param {string} table
 * @param {string} column
 * @param {string[]|Set<string>} stats
 * @returns
 */
function summarize(table, column, stats) {
  return Query
    .from(table)
    .select(Array.from(stats, s => ({[s]: statMap[s](column)})));
}

export async function queryFieldInfo(mc, fields) {
  if (fields.length === 1 && fields[0].column === '*') {
    return getTableInfo(mc, fields[0].table);
  } else {
    return (await Promise
      .all(fields.map(f => getFieldInfo(mc, f))))
      .filter(x => x);
  }
}

async function getFieldInfo(mc, { table, column, stats }) {
  // generate and issue a query for field metadata info
  // use GROUP BY ALL to differentiate & consolidate aggregates
  const q = Query
    .from({ source: table })
    .select({ column })
    .groupby(column.aggregate ? sql`ALL` : []);
  const [desc] = Array.from(await mc.query(Query.describe(q)));
  const info = {
    table,
    column: `${column}`,
    sqlType: desc.column_type,
    type: jsType(desc.column_type),
    nullable: desc.null === 'YES'
  };

  // no need for summary statistics
  if (!(stats?.length || stats?.size)) return info;

  // query for summary stats
  const [result] = await mc.query(
    summarize(table, column, stats),
    { persist: true }
  );

  // extract summary stats, copy to field info, and return
  return Object.assign(info, result);
}

async function getTableInfo(mc, table) {
  const result = await mc.query(`DESCRIBE ${asTableRef(table)}`);
  return Array.from(result).map(desc => ({
    table,
    column: desc.column_name,
    sqlType: desc.column_type,
    type: jsType(desc.column_type),
    nullable: desc.null === 'YES'
  }));
}
