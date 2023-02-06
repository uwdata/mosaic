import { transform } from '@uwdata/mosaic-sql';

export const dateMonth = transform(
  v => `MAKE_DATE(2012, MONTH(${v}), 1)`,
  'month'
);

export const dateMonthDay = transform(
  v => `MAKE_DATE(2012, MONTH(${v}), DAY(${v}))`,
  'date'
);

export const dateDay = transform(
  v => `MAKE_DATE(2012, 1, DAY(${v}))`,
  'date'
);
