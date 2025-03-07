import { binStep } from './bin-step.js';

const YEAR = 'year';
const MONTH = 'month';
const DAY = 'day';
const HOUR = 'hour';
const MINUTE = 'minute';
const SECOND = 'second';
const MILLISECOND = 'millisecond';

const durationSecond = 1000;
const durationMinute = durationSecond * 60;
const durationHour = durationMinute * 60;
const durationDay = durationHour * 24;
const durationWeek = durationDay * 7;
const durationMonth = durationDay * 30;
const durationYear = durationDay * 365;

/** @type {[string, number, number][]} */
const intervals = [
  [SECOND,  1,      durationSecond],
  [SECOND,  5,  5 * durationSecond],
  [SECOND, 15, 15 * durationSecond],
  [SECOND, 30, 30 * durationSecond],
  [MINUTE,  1,      durationMinute],
  [MINUTE,  5,  5 * durationMinute],
  [MINUTE, 15, 15 * durationMinute],
  [MINUTE, 30, 30 * durationMinute],
  [  HOUR,  1,      durationHour  ],
  [  HOUR,  3,  3 * durationHour  ],
  [  HOUR,  6,  6 * durationHour  ],
  [  HOUR, 12, 12 * durationHour  ],
  [   DAY,  1,      durationDay   ],
  [   DAY,  7,      durationWeek  ],
  [ MONTH,  1,      durationMonth ],
  [ MONTH,  3,  3 * durationMonth ],
  [  YEAR,  1,      durationYear  ]
];

export function timeInterval(min, max, steps) {
  const span = max - min;
  const target = span / steps;
  let i = bisect(intervals, target, i => i[2]);
  if (i === intervals.length) {
    return { unit: YEAR, step: binStep(span / durationYear, steps) };
  } else if (i) {
    const v = intervals[
      target / intervals[i - 1][2] < intervals[i][2] / target ? i - 1 : i
    ];
    return { unit: v[0], step: v[1] };
  } else {
    return { unit: MILLISECOND, step: binStep(span, steps, 1) };
  }
}

/**
 * Perform a binary search.
 * @template I, T
 * @param {I[]} a The array to search.
 * @param {T} x The target value
 * @param {(item: I) => T} accessor
 * @returns {number} The search result array index.
 */
function bisect(a, x, accessor) {
  const compare1 = (a, b) => a - b;
  const compare2 = (d, x) => compare1(accessor(d), x);

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
