import type { ExprValue } from '../types.js';
import { aggFn, fn } from '../util/function.js';

/**
 * Compute a HyperLogLog (HLL) sketch aggregate for approximate distinct
 * counting. If the input expression is itself an HLL sketch, use
 * `hllUnion` to merge sketches instead.
 * Requires the DuckDB `datasketches` extension.
 * @param expr The expression to sketch.
 * @param lgK The log2 of the number of sketch buckets (default 12).
 * @returns A SQL aggregate function call.
 */
export function hllSketch(expr: ExprValue, lgK: number = 12) {
  return aggFn('datasketch_hll', lgK, expr);
}

/**
 * Compute a merged HyperLogLog (HLL) sketch from input HLL sketches.
 * Requires the DuckDB `datasketches` extension.
 * @param sketch The HLL sketches to merge.
 * @param lgK The log2 of the number of sketch buckets (default 12).
 * @returns A SQL aggregate function call.
 */
export function hllUnion(sketch: ExprValue, lgK: number = 12) {
  return aggFn('datasketch_hll_union', lgK, sketch);
}

/**
 * Return the estimated distinct count of a HyperLogLog (HLL) sketch.
 * Requires the DuckDB `datasketches` extension.
 * @param sketch The HLL sketch.
 * @returns A SQL function call.
 */
export function hllEstimate(sketch: ExprValue) {
  return fn('datasketch_hll_estimate', sketch);
}

/**
 * Compute a Compressed Probabilistic Counting (CPC) sketch aggregate for
 * approximate distinct counting. CPC sketches are smaller and faster to merge
 * than HLL sketches of similar accuracy. If the input expression is itself a
 * CPC sketch, use `cpcUnion` to merge sketches instead.
 * Requires the DuckDB `datasketches` extension.
 * @param expr The expression to sketch.
 * @param lgK The log2 of the sketch size parameter (default 11).
 * @returns A SQL aggregate function call.
 */
export function cpcSketch(expr: ExprValue, lgK: number = 11) {
  return aggFn('datasketch_cpc', lgK, expr);
}

/**
 * Compute a merged Compressed Probabilistic Counting (CPC) sketch from
 * input CPC sketches.
 * Requires the DuckDB `datasketches` extension.
 * @param sketch The CPC sketches to merge.
 * @param lgK The log2 of the sketch size parameter (default 11).
 * @returns A SQL aggregate function call.
 */
export function cpcUnion(sketch: ExprValue, lgK: number = 11) {
  return aggFn('datasketch_cpc_union', lgK, sketch);
}

/**
 * Return the estimated distinct count of a Compressed Probabilistic
 * Counting (CPC) sketch.
 * Requires the DuckDB `datasketches` extension.
 * @param sketch The CPC sketch.
 * @returns A SQL function call.
 */
export function cpcEstimate(sketch: ExprValue) {
  return fn('datasketch_cpc_estimate', sketch);
}

/**
 * Compute a KLL sketch aggregate for approximate quantile estimation.
 * If the input expression is a KLL sketch, the sketches are merged.
 * Requires the DuckDB `datasketches` extension.
 * @param expr The numeric expression or KLL sketches to aggregate.
 * @param k The sketch size parameter, trading off size and accuracy
 *  (default 200).
 * @returns A SQL aggregate function call.
 */
export function kllSketch(expr: ExprValue, k: number = 200) {
  return aggFn('datasketch_kll', k, expr);
}

/**
 * Return the estimated quantile value of a KLL sketch.
 * Requires the DuckDB `datasketches` extension.
 * @param sketch The KLL sketch.
 * @param rank The normalized rank of the quantile, in the range [0, 1].
 * @param inclusive Flag for inclusive (default) or exclusive rank
 *  semantics.
 * @returns A SQL function call.
 */
export function kllQuantile(
  sketch: ExprValue,
  rank: ExprValue,
  inclusive: boolean = true
) {
  return fn('datasketch_kll_quantile', sketch, rank, inclusive);
}
