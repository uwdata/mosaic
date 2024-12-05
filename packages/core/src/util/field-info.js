import { AggregateNode, Query, asTableRef, count, isNull, max, min, sql } from '@uwdata/mosaic-sql';
import { jsType } from './js-type.js';

export const Count = 'count';
export const Nulls = 'nulls';
export const Max = 'max';
export const Min = 'min';
export const Distinct = 'distinct';
export const Stats = { Count, Nulls, Max, Min, Distinct };

/**
 * @typedef {Count | Distinct | Max | Min | Nulls} Stat
 * 
 * @typedef {{
 *   table: string | import('@uwdata/mosaic-sql').TableRefNode,
 *   column: (string | import('@uwdata/mosaic-sql').ColumnRefNode) & { aggregate?: boolean },
 *   stats?: Stat[] | Set<Stat>
 * }} FieldInfoRequest
 * 
 * @typedef {{
 *   table: FieldInfoRequest["table"],
 *   column: string,
 *   sqlType: string,
 *   type: ReturnType<typeof jsType>,
 *   nullable: boolean,
 * } & Partial<Record<Stat, number>>} FieldInfo
 */

/**
 * @type {Record<Stat, (column: FieldInfoRequest["column"]) => AggregateNode>}
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
 * @param {FieldInfoRequest} field
 * @returns {import('@uwdata/mosaic-sql').Query}
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
 * @param {FieldInfoRequest[]} fields 
 * @returns {Promise<FieldInfo[]>}
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
 * @param {FieldInfoRequest} field 
 * @returns {Promise<FieldInfo>}
 */
async function getFieldInfo(mc, { table, column, stats }) {
  // generate and issue a query for field metadata info
  // use GROUP BY ALL to differentiate & consolidate aggregates
  const q = Query
    .from({ source: table })
    .select({ column })
    .groupby(column.aggregate ? sql`ALL` : []);
  /** @type {{ column_name: string, column_type: string, null: "YES" | "NO" }[]} */
  const [desc] = Array.from(await mc.query(Query.describe(q)));
  const info = {
    table,
    column: `${column}`,
    sqlType: desc.column_type,
    type: jsType(desc.column_type),
    nullable: desc.null === 'YES'
  };

  // no need for summary statistics
  if (!((stats instanceof Set && stats.size) || (Array.isArray(stats) && stats.length))) return info;

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
 * @param {FieldInfoRequest["table"]} table the table name or reference 
 * @returns {Promise<FieldInfo[]>}
 */
async function getTableInfo(mc, table) {
  /** @type {{ column_name: string, column_type: string, null: "YES" | "NO" }[]} */
  const result = Array.from(await mc.query(`DESCRIBE ${asTableRef(table)}`));
  return result.map(desc => ({
    table,
    column: desc.column_name,
    sqlType: desc.column_type,
    type: jsType(desc.column_type),
    nullable: desc.null === 'YES'
  }));
}
