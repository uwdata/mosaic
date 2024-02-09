/**
 * Valid transform method names.
 */
export function transformNames(overrides = []) {
  return new Set([
    'avg',
    'bin',
    'centroid',
    'centroidX',
    'centroidY',
    'count',
    'dateMonth',
    'dateMonthDay',
    'dateDay',
    'geojson',
    'max',
    'median',
    'min',
    'mode',
    'quantile',
    'sum',
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
    ...overrides
  ]);
}
