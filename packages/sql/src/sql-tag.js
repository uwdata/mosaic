import { expr, exprParams, isParamLike } from './expression.js';

/**
 * Tag function for SQL expression strings. Interpolated values
 * may be strings, other SQL expression objects (such as column
 * references), or parameterized values.
 */
export function sql(strings, ...exprs) {
  const spans = [strings[0]];
  const colset = new Set;
  const n = exprs.length;
  for (let i = 0, k = 0; i < n;) {
    const e = exprs[i];
    if (isParamLike(e)) {
      spans[++k] = e;
    } else {
      if (Array.isArray(e.columns)) {
        e.columns.forEach(col => colset.add(col));
      }
      spans[k] += String(e);
    }
    const s = strings[++i];
    if (isParamLike(spans[k])) {
      spans[++k] = s;
    } else {
      spans[k] += s;
    }
  }

  const columns = Array.from(colset);
  return spans.length > 1
    ? exprParams(spans, columns)
    : expr(spans[0], columns);
}
