import { binStep } from './bin-step.js';

export type DateTimeValue = Date | number;

export type TimeUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'
  | 'microsecond';

const YEAR = 'year';
const MONTH = 'month';
const DAY = 'day';
const HOUR = 'hour';
const MINUTE = 'minute';
const SECOND = 'second';
const MILLISECOND = 'millisecond';
const MICROSECOND = 'microsecond';

const durationSecond = 1000;
const durationMinute = durationSecond * 60;
const durationHour = durationMinute * 60;
const durationDay = durationHour * 24;
const durationWeek = durationDay * 7;
const durationMonth = durationDay * 30;
const durationYear = durationDay * 365;

const units: {unit: TimeUnit, step: number, dt: number}[] = [
  { unit: SECOND, step:  1, dt: durationSecond },
  { unit: SECOND, step:  5, dt: durationSecond * 5 },
  { unit: SECOND, step: 15, dt: durationSecond * 15 },
  { unit: SECOND, step: 30, dt: durationSecond * 30 },
  { unit: MINUTE, step:  1, dt: durationMinute },
  { unit: MINUTE, step:  5, dt: durationMinute * 5 },
  { unit: MINUTE, step: 15, dt: durationMinute * 15 },
  { unit: MINUTE, step: 30, dt: durationMinute * 30 },
  { unit: HOUR,   step:  1, dt: durationHour },
  { unit: HOUR,   step:  3, dt: durationHour * 3 },
  { unit: HOUR,   step:  6, dt: durationHour * 6 },
  { unit: HOUR,   step: 12, dt: durationHour * 12 },
  { unit: DAY,    step:  1, dt: durationDay },
  { unit: DAY,    step:  7, dt: durationWeek },
  { unit: MONTH,  step:  1, dt: durationMonth },
  { unit: MONTH,  step:  3, dt: durationMonth * 3 },
  { unit: YEAR,   step:  1, dt: durationYear }
];

/**
 * Determine a time interval for binning based on provided min
 * and max timestamps and approximate step count.
 * @param min The minimum timestamp value.
 * @param max The maximum timestamp value.
 * @param steps The approximate number of bins desired.
 */
export function timeInterval(
  min: DateTimeValue,
  max: DateTimeValue,
  steps: number
): ({ unit: TimeUnit, step: number }) {
  const span = +max - +min;

  // if degenerate span, default to one day
  if (span === 0) return { unit: DAY, step: 1 };

  const t = span / steps; // target step size duration
  const i = bisect(units, t, v => v.dt);

  let unit: TimeUnit;
  let step: number;

  if (i === units.length) {
    unit = YEAR;
    step = binStep(span / durationYear, steps);
  } else if (i) {
    ({ unit, step } = units[t / units[i-1].dt < units[i].dt / t ? i-1 : i]);
  } else {
    step = binStep(span, steps);
    unit = step >= 1 ? MILLISECOND : MICROSECOND;
    step = step >= 1 ? step : step * 1000;
  }
  return { unit, step };
}

/**
 * Perform a binary search.
 * @param a The array to search.
 * @param x The target value.
 * @param value A value accessor.
 * @returns The search result array index.
 */
function bisect<I, T>(a: I[], x: T, value: (item: I) => T) {
  const compare1 = (a: T, b: T) => Number(a) - Number(b);
  const compare2 = (d: I, x: T) => compare1(value(d), x);

  let lo = 0;
  let hi = a.length;

  if (lo < hi) {
    if (compare1(x, x) !== 0) return hi;
    do {
      const mid = (lo + hi) >>> 1;
      if (compare2(a[mid], x) <= 0) lo = mid + 1;
      else hi = mid;
    } while (lo < hi);
  }
  return lo;
}
