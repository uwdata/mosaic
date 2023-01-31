import { transform } from '@mosaic/sql';

export const dateMonth = transform(
  v => `make_date(2012, month(${v}), 1)`,
  'month'
);

export const dateMonthDay = transform(
  v => `make_date(2012, month(${v}), day(${v}))`,
  'date'
);

export const dateDay = transform(
  v => `make_date(2012, 1, day(${v}))`,
  'date'
);
