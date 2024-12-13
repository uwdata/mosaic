import { AggregateNode, Query, asTableRef, count, isAggregateExpression, isNode, isNull, max, min, sql } from '@uwdata/mosaic-sql';
import { jsType } from './js-type.js';

export const Count = 'count';
export const Nulls = 'nulls';
export const Max = 'max';
export const Min = 'min';
export const Distinct = 'distinct';
export const Stats = { Count, Nulls, Max, Min, Distinct };

/**
 * @type {Record<
 *  import('../types.js').Stat,
 *  (column: import('../types.js').FieldRef) => AggregateNode
 * >}
 */
const statMap = {
  [Count]: count,
  [Distinct]: column => count(column).distinct(),
  [Max]: max,
  [Min]: min,
  [Nulls]: column => count().where(isNull(column))
};

/**
 * Get summary stats of the given column
 * @param {import('../types.js').FieldInfoRequest} field
 * @returns {Query}
 */
function summarize({ table, column, stats }) {
  return Query
    .from(table)
    .select(Array.from(stats, s => ({ [s]: statMap[s](column) })));
}

/**
 * Queries information about fields of a table.
 * If the `fields` array contains a single field with the column set to '*',
 * the function will retrieve and return the table information using `getTableInfo`.
 * Otherwise, it will query individual field information using `getFieldInfo`
 * for each field in the `fields` array.
 * @param {import('../Coordinator.js').Coordinator} mc A Mosaic coordinator.
 * @param {import('../types.js').FieldInfoRequest[]} fields
 * @returns {Promise<import('../types.js').FieldInfo[]>}
 */
export async function queryFieldInfo(mc, fields) {
  if (fields.length === 1 && fields[0].column === '*') {
    return getTableInfo(mc, fields[0].table);
  } else {
    return (await Promise
      .all(fields.map(f => getFieldInfo(mc, f))))
      .filter(x => x);
  }
}

/**
 * Get information about a single field of a table.
 * @param {import('../Coordinator.js').Coordinator} mc A Mosaic coordinator.
 * @param {import('../types.js').FieldInfoRequest} field
 * @returns {Promise<import('../types.js').FieldInfo>}
 */
async function getFieldInfo(mc, { table, column, stats }) {
  // generate and issue a query for field metadata info
  // use GROUP BY ALL to differentiate & consolidate aggregates
  const q = Query
    .from({ source: table })
    .select({ column })
    .groupby(isNode(column) && isAggregateExpression(column) ? sql`ALL` : []);

  /** @type {import('../types.js').ColumnDescription[]} */
  const [desc] = Array.from(await mc.query(Query.describe(q)));
  const info = {
    table,
    column: `${column}`,
    sqlType: desc.column_type,
    type: jsType(desc.column_type),
    nullable: desc.null === 'YES'
  };

  // no need for summary statistics
  if (!stats?.length) return info;

  // query for summary stats
  const [result] = await mc.query(
    summarize({ table, column, stats }),
    { persist: true }
  );

  // extract summary stats, copy to field info, and return
  return Object.assign(info, result);
}

/**
 * Get information about the fields of a table.
 * @param {import('../Coordinator.js').Coordinator} mc A Mosaic coordinator.
 * @param {string} table The table name.
 * @returns {Promise<import('../types.js').FieldInfo[]>}
 */
async function getTableInfo(mc, table) {
  /** @type {import('../types.js').ColumnDescription[]} */
  const result = Array.from(await mc.query(`DESCRIBE ${asTableRef(table)}`));
  return result.map(desc => ({
    table,
    column: desc.column_name,
    sqlType: desc.column_type,
    type: jsType(desc.column_type),
    nullable: desc.null === 'YES'
  }));
}
