export const clickhouseUnsupported = {
  'earthquakes-feed': 'spatial data',
  'earthquakes-globe': 'spatial data',
  'flights-10m': 'DuckDB SQL in data definition',
  gaia: 'DuckDB SQL in data definition',
  'linear-regression-10m': 'DuckDB SQL in data definition',
  'mark-types': 'inline data in spec',
  'nyc-taxi-rides': 'remote data file',
  'observable-latency': 'remote data file',
  'region-tests': 'spatial data',
  'seattle-weather-pivot': 'PIVOT is not supported',
  unemployment: 'spatial data',
  'us-county-map': 'spatial data',
  'us-state-map': 'spatial data',
  'walmart-openings': 'spatial data',
  'window-frame': 'RANGE frames with date intervals',
};

export function clickhouseSupports(name) {
  return !Object.hasOwn(clickhouseUnsupported, name);
}

export function clickhouseDatabase(name) {
  return `mosaic_demo_${name.replaceAll('-', '_')}`;
}
