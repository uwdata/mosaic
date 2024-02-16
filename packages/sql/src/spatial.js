import { functionCall } from './functions.js';

export const geojson = functionCall('ST_AsGeoJSON');

export const x = functionCall('ST_X');
export const y = functionCall('ST_Y');

export const centroid = functionCall('ST_CENTROID');
export const centroidX = geom => x(centroid(geom));
export const centroidY = geom => y(centroid(geom));
