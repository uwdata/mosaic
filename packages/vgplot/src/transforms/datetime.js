import { asColumn, sql } from '@uwdata/mosaic-sql';

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
