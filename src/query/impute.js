// TODO better way of handling this
function isAggregate(value) {
  const s = String(value || '').toUpperCase();
  return s.startsWith('MIN(')
    || s.startsWith('MAX(')
    || s.startsWith('AVG(')
    || s.startsWith('MEDIAN(');
}

export function impute(input, field, value, groupby, expand) {
  if (!groupby) groupby = [];
  if (!expand) expand = [];
  if (!Array.isArray(groupby)) groupby = [groupby];
  if (!Array.isArray(expand)) expand = [expand];
  const aggr = isAggregate(value);
  const over = groupby.length ? `OVER(PARTITION BY ${groupby})` : aggr ? 'OVER()' : '';

  if (expand.length === 0) {
    return `
SELECT
  *,
  COALESCE(${field}, ${value}${over}) AS ${field}
FROM ${input}
`;
  }

  if (groupby.length === 0) {
    return `
WITH
  imp AS (
    ${expandQuery(input, expand)}
  )
SELECT
  ${expand.map(f => `imp.${f} AS ${f}`)},
  COALESCE(${input}.${field}, ${value}${over}) AS ${field}
FROM ${input}
  RIGHT JOIN imp
  ON (${expand.map(f => `${input}.${f} = imp.${f}`).join(' AND ')})
`;
  }

  return `
WITH
  values AS (
    SELECT ${groupby}, ${value} AS ${field}
    FROM ${input}
    GROUP BY ${groupby}
  ),
  grid AS (
    ${expandQuery(input, expand)}
  ),
  imp AS (
    SELECT * FROM values CROSS JOIN grid
  )
SELECT
  ${groupby.map(f => `imp.${f} AS ${f}`)},
  ${expand.map(f => `imp.${f} AS ${f}`)},
  COALESCE(${input}.${field}, imp.${field}) AS ${field}
FROM ${input}
  RIGHT JOIN imp
  ON (${[
    ...groupby.map(f => `${input}.${f} = imp.${f}`),
    ...expand.map(f => `${input}.${f} = imp.${f}`)
  ].join(' AND ')})
`;
}

function expandQuery(table, fields) {
  if (fields.length === 1) {
    return `SELECT DISTINCT ${fields[0]} FROM ${table}`;
  } else {
    const sub = fields.map(
      (f, i) => `(SELECT DISTINCT ${f} FROM ${table}) AS sub${i}`
    );
    return `SELECT ${fields} FROM ${sub.join(', ')}`;
  }
}
