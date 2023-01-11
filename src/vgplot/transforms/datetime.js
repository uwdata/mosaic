import { transform } from '../../sql/index.js';

export const dateMonth = transform(
  v => `make_date(2012, month(${v}), 1)`
);

export const dateMonthDay = transform(
  v => `make_date(2012, month(${v}), day(${v}))`
);

export const dateDay = transform(
  v => `make_date(2012, 1, day(${v}))`
);
