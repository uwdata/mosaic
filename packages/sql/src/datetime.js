import { sql } from './expression.js';
import { asColumn } from './ref.js';

export const epoch_ms = expr => {
  return sql`epoch_ms(${asColumn(expr)})`;
};

export function dateBin(expr, interval, steps = 1) {
  const i = `INTERVAL ${steps} ${interval}`;
  const d = asColumn(expr);
  return sql`TIME_BUCKET(${i}, ${d})`
    .annotate({ label: interval });
}

export const dateMonth = expr => {
  const d = asColumn(expr);
  return sql`MAKE_DATE(2012, MONTH(${d}), 1)`
    .annotate({ label: 'month' });
};

export const dateMonthDay = expr => {
  const d = asColumn(expr);
  return sql`MAKE_DATE(2012, MONTH(${d}), DAY(${d}))`
    .annotate({ label: 'date' });
};

export const dateDay = expr => {
  const d = asColumn(expr);
  return sql`MAKE_DATE(2012, 1, DAY(${d}))`
    .annotate({ label: 'date' });
};
