import { literalToSQL } from "../to-sql";

/**
 * Generates SQL from a set of objects and optionally maps them to new column
 * names
 * @param data - an array of objects to load
 * @param columns - [optional] an array of column names or a map of old column names to new
 * @returns
 */
export function sqlFrom(
  data: { [key: string]: any }[],
  { columns }: { columns?: string[] | { [key: string]: string } } = {}
) {
  if (!columns) {
    columns = Object.keys(data[0]);
  }
  let keys: string[] = [];
  if (Array.isArray(columns)) {
    keys = columns;
    columns = keys.reduce(
      (m: { [key: string]: any }, k) => ((m[k] = k), m),
      {}
    );
  } else if (columns) {
    keys = Object.keys(columns);
  }
  if (!keys.length) {
    throw new Error("Can not create table from empty column set.");
  }
  const subq: string[] = [];
  const columnMap = columns as { [key: string]: string };
  for (const datum of data) {
    const sel = keys.map(
      (k) => `${literalToSQL(datum[k])} AS "${columnMap[k]}"`
    );
    subq.push(`(SELECT ${sel.join(", ")})`);
  }
  return subq.join(" UNION ALL ");
}
