import { bisector } from 'd3';
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
  let i = bisector(i => i[2]).right(intervals, target);
  if (i === intervals.length) {
    return { interval: YEAR, step: binStep(span, steps) };
  } else if (i) {
    i = intervals[target / intervals[i - 1][2] < intervals[i][2] / target ? i - 1 : i];
    return { interval: i[0], step: i[1] };
  } else {
    return { interval: MILLISECOND, step: binStep(span, steps, 1) };
  }
}
