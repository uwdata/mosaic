import type { ExprValue } from '../types.js';
import { fn } from '../util/function.js';

/**
 * Function that converts geometry data to GeoJSON format.
 * @param expr The input expression.
 */
export function geojson(expr: ExprValue) {
  return fn('st_asgeojson', expr);
}

/**
 * Function that returns a spatial x position (using ST_X).
 * @param expr The input expression.
 */
export function x(expr: ExprValue) {
  return fn('st_x', expr);
}

/**
 * Function that returns a spatial y position (using ST_Y).
 * @param expr The input expression.
 */
export function y(expr: ExprValue) {
  return fn('st_y', expr);
}

/**
 * Function that returns the centroid point for geometry data.
 * @param expr The input expression.
 */
export function centroid(expr: ExprValue) {
  return fn('st_centroid', expr);
}

/**
 * Function that returns the centroid x-coordinate for geometry data.
 * @param expr The input expression.
 */
export function centroidX(expr: ExprValue) {
  return x(centroid(expr));
}

/**
 * Function that returns yhe centroid y-coordinate for geometry data.
 * @param expr The input expression.
 */
export function centroidY(expr: ExprValue) {
  return y(centroid(expr));
}
