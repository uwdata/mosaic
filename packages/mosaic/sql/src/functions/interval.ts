import { IntervalNode } from '../ast/interval.js';

/**
 * Create a new interval.
 * @param unit The interval unit, such as day or year.
 * @param steps The number of interval unit steps.
 */
export function interval(unit: string, steps: number) {
  return new IntervalNode(unit, steps);
}

/**
 * Create a new years interval.
 * @param steps The number of years.
 */
export function years(steps: number) {
  return interval('YEARS', steps);
}

/**
 * Create a new months interval.
 * @param steps The number of months.
 */
export function months(steps: number) {
  return interval('MONTHS', steps);
}

/**
 * Create a new days interval.
 * @param steps The number of days.
 */
export function days(steps: number) {
  return interval('DAYS', steps);
}

/**
 * Create a new hours interval.
 * @param steps The number of hours.
 */
export function hours(steps: number) {
  return interval('HOURS', steps);
}

/**
 * Create a new minutes interval.
 * @param steps The number of minutes.
 */
export function minutes(steps: number) {
  return interval('MINUTES', steps);
}

/**
 * Create a new seconds interval.
 * @param steps The number of seconds.
 */
export function seconds(steps: number) {
  return interval('SECONDS', steps);
}

/**
 * Create a new milliseconds interval.
 * @param steps The number of milliseconds.
 */
export function milliseconds(steps: number) {
  return interval('MILLISECONDS', steps);
}

/**
 * Create a new microseconds interval.
 * @param steps The number of microseconds.
 */
export function microseconds(steps: number) {
  return interval('MICROSECONDS', steps);
}
