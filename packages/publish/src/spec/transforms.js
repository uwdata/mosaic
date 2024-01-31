import {
  avg, count, max, median, min, mode, quantile, sum,
  row_number, rank, dense_rank, percent_rank, cume_dist, ntile,
  lag, lead, first_value, last_value, nth_value,
  dateMonth, dateMonthDay, dateDay
} from '@uwdata/mosaic-sql';
import { bin } from '@uwdata/vgplot';

/**
 * Map of transform names to transform methods.
 */
export function transformMap(overrides = []) {
  return new Map([
    ['avg', avg],
    ['bin', bin],
    ['count', count],
    ['dateMonth', dateMonth],
    ['dateMonthDay', dateMonthDay],
    ['dateDay', dateDay],
    ['bin', bin],
    ['max', max],
    ['median', median],
    ['min', min],
    ['mode', mode],
    ['quantile', quantile],
    ['sum', sum],
    ['row_number', row_number],
    ['rank', rank],
    ['dense_rank', dense_rank],
    ['percent_rank', percent_rank],
    ['cume_dist', cume_dist],
    ['ntile', ntile],
    ['lag', lag],
    ['lead', lead],
    ['first_value', first_value],
    ['last_value', last_value],
    ['nth_value', nth_value]
  ]);
}
