import { IntervalNode } from '../ast/interval.js';

/**
 * Create a new interval.
 * @param {string} unit The interval unit, such as day or year.
 * @param {number} steps The number of interval unit steps.
 * @returns {IntervalNode}
 */
export function interval(unit, steps) {
  return new IntervalNode(unit, steps);
}

/**
 * Create a new years interval.
 * @param {number} steps The number of years.
 * @returns {IntervalNode}
 */
export function years(steps) {
  return interval('YEARS', steps);
}

/**
 * Create a new months interval.
 * @param {number} steps The number of months.
 * @returns {IntervalNode}
 */
export function months(steps) {
  return interval('MONTHS', steps);
}

/**
 * Create a new days interval.
 * @param {number} steps The number of days.
 * @returns {IntervalNode}
 */
export function days(steps) {
  return interval('DAYS', steps);
}

/**
 * Create a new hours interval.
 * @param {number} steps The number of hours.
 * @returns {IntervalNode}
 */
export function hours(steps) {
  return interval('HOURS', steps);
}

/**
 * Create a new minutes interval.
 * @param {number} steps The number of minutes.
 * @returns {IntervalNode}
 */
export function minutes(steps) {
  return interval('MINUTES', steps);
}

/**
 * Create a new seconds interval.
 * @param {number} steps The number of seconds.
 * @returns {IntervalNode}
 */
export function seconds(steps) {
  return interval('SECONDS', steps);
}

/**
 * Create a new milliseconds interval.
 * @param {number} steps The number of milliseconds.
 * @returns {IntervalNode}
 */
export function milliseconds(steps) {
  return interval('MILLISECONDS', steps);
}

/**
 * Create a new microseconds interval.
 * @param {number} steps The number of microseconds.
 * @returns {IntervalNode}
 */
export function microseconds(steps) {
  return interval('MICROSECONDS', steps);
}
