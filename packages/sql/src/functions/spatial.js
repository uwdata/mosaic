import { FunctionNode } from '../ast/function.js';
import { fn } from '../util/function.js';

/**
 * Function that converts geometry data to GeoJSON format.
 * @param {import('../types.js').ExprValue} expr The input expression.
 * @returns {FunctionNode}
 */
export function geojson(expr) {
  return fn('st_asgeojson', expr);
}

/**
 * Function that returns a spatial x position (using ST_X).
 * @param {import('../types.js').ExprValue} expr The input expression.
 * @returns {FunctionNode}
 */
export function x(expr) {
  return fn('st_x', expr);
}

/**
 * Function that returns a spatial y position (using ST_Y).
 * @param {import('../types.js').ExprValue} expr The input expression.
 * @returns {FunctionNode}
 */
export function y(expr) {
  return fn('st_y', expr);
}

/**
 * Function that returns the centroid point for geometry data.
 * @param {import('../types.js').ExprValue} expr The input expression.
 * @returns {FunctionNode}
 */
export function centroid(expr) {
  return fn('st_centroid', expr);
}

/**
 * Function that returns the centroid x-coordinate for geometry data.
 * @param {import('../types.js').ExprValue} expr The input expression.
 * @returns {FunctionNode}
 */
export function centroidX(expr) {
  return x(centroid(expr));
}

/**
 * Function that returns yhe centroid y-coordinate for geometry data.
 * @param {import('../types.js').ExprValue} expr The input expression.
 * @returns {FunctionNode}
 */
export function centroidY(expr) {
  return y(centroid(expr));
}
