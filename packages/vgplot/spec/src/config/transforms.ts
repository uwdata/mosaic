const NAMES = [
  'argmin',
  'argmax',
  'avg',
  'bin',
  'centroid',
  'centroidX',
  'centroidY',
  'column',
  'count',
  'covariance',
  'covarPop',
  'dateMonth',
  'dateMonthDay',
  'dateDay',
  'first',
  'geomean',
  'geojson',
  'last',
  'max',
  'median',
  'min',
  'mode',
  'product',
  'quantile',
  'stddev',
  'stddevPop',
  'sum',
  'variance',
  'varPop',
  'row_number',
  'rank',
  'dense_rank',
  'percent_rank',
  'cume_dist',
  'ntile',
  'lag',
  'lead',
  'first_value',
  'last_value',
  'nth_value',
  'years',
  'months',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
] as const


export type TransformName = (typeof NAMES)[number]
/**
 * Valid transform method names.
 */
export function transformNames<T extends string>(overrides:T[] = []): Set<T | TransformName> {
  return new Set([
    ...NAMES,
    ...overrides
  ]);
}
