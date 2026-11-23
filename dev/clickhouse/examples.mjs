export const clickhouseUnsupported = {
  'earthquakes-feed': 'spatial data',
  'earthquakes-globe': 'spatial data',
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

export const clickhouseRemoteExamples = ['flights-10m', 'gaia', 'linear-regression-10m'];

export function clickhouseSupports(name) {
  return !Object.hasOwn(clickhouseUnsupported, name);
}

export function clickhouseDatabase(name) {
  return `mosaic_demo_${name.replaceAll('-', '_')}`;
}
