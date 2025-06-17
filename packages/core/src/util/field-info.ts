import type { AggregateNode } from '@uwdata/mosaic-sql';
import { Query, asTableRef, count, isAggregateExpression, isNode, isNull, max, min, sql } from '@uwdata/mosaic-sql';
import { jsType } from './js-type.js';
import type { Coordinator } from '../Coordinator.js';
import type { FieldInfoRequest, FieldInfo, Stat, FieldRef, ColumnDescription } from '../types.js';

export const Count = 'count';
export const Nulls = 'nulls';
export const Max = 'max';
export const Min = 'min';
export const Distinct = 'distinct';
export const Stats = { Count, Nulls, Max, Min, Distinct };

const statMap: Record<Stat, (column: FieldRef) => AggregateNode> = {
  [Count]: count,
  [Distinct]: column => count(column).distinct(),
  [Max]: max,
  [Min]: min,
  [Nulls]: column => count().where(isNull(column))
};

/**
 * Get summary stats of the given column
 * @param field Field information request
 * @returns Query for field statistics
 */
function summarize({ table, column, stats }: FieldInfoRequest): Query {
  return Query
    .from(table)
    .select(Array.from(stats!, s => ({ [s]: statMap[s](column) })));
}

/**
 * Queries information about fields of a table.
 * If the `fields` array contains a single field with the column set to '*',
 * the function will retrieve and return the table information using `getTableInfo`.
 * Otherwise, it will query individual field information using `getFieldInfo`
 * for each field in the `fields` array.
 * @param mc A Mosaic coordinator.
 * @param fields Array of field information requests.
 * @returns Promise resolving to array of field information.
 */
export async function queryFieldInfo(mc: Coordinator, fields: FieldInfoRequest[]): Promise<FieldInfo[]> {
  if (fields.length === 1 && fields[0].column === '*') {
    return getTableInfo(mc, fields[0].table);
  } else {
    return (await Promise
      .all(fields.map(f => getFieldInfo(mc, f))))
      .filter((x): x is FieldInfo => x !== undefined);
  }
}

/**
 * Get information about a single field of a table.
 * @param mc A Mosaic coordinator.
 * @param field Field information request.
 * @returns Promise resolving to field information.
 */
async function getFieldInfo(mc: Coordinator, { table, column, stats }: FieldInfoRequest): Promise<FieldInfo> {
  // generate and issue a query for field metadata info
  // use GROUP BY ALL to differentiate & consolidate aggregates
  const q = Query
    .from({ source: table })
    .select({ column })
    .groupby(isNode(column) && isAggregateExpression(column) ? sql`ALL` : []);

  const [desc] = Array.from(await mc.query(Query.describe(q))) as ColumnDescription[];
  const info: FieldInfo = {
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
 * @param mc A Mosaic coordinator.
 * @param table The table name.
 * @returns Promise resolving to array of field information.
 */
async function getTableInfo(mc: Coordinator, table: string): Promise<FieldInfo[]> {
  const result = Array.from(await mc.query(`DESCRIBE ${asTableRef(table)}`)) as ColumnDescription[];
  return result.map(desc => ({
    table,
    column: desc.column_name,
    sqlType: desc.column_type,
    type: jsType(desc.column_type),
    nullable: desc.null === 'YES'
  }));
}