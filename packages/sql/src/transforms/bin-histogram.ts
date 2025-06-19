import type { ExprNode } from '../ast/node.js';
import type { ExprValue } from '../types.js';
import { float64 } from '../functions/cast.js';
import { floor } from '../functions/numeric.js';
import { add, div, mul, sub } from '../functions/operators.js';
import { binSpec } from './util/bin-step.js';
import { ScaleDescriptor, scaleTransform } from './scales.js';

export interface BinHistogramOptions {
  /** An exact binning step to use. */
  step?: number;
  /**
   * The desired number of binning steps. This value is a hint,
   * it does not guarantee an exact number of steps.
   */
  steps?: number;
  /**
   * A minimum binning step value. No generated
   * step can be less than this value.
   */
  minstep?: number;
  /**
   * A boolean flag (default true) indicating if bin extents should be
   * snapped to "nice" numbers such as multiples of 5 or 10.
   */
  nice?: boolean;
  /**
   * The number of bin steps (default 0) by which to offset the result.
   */
  offset?: number;
}

/**
 * Return a SQL expression for histogram bins.
 * @param field The column or expression to bin.
 * @param extent The min/max extent over which to bin.
 * @param options Binning options.
 * @param transform Scale transforms to apply to create
 *  (potentially non-linear) binning intervals.
 * @returns The resulting SQL expression
 */
export function binHistogram<T>(
  field: ExprValue,
  extent: [number, number],
  options: BinHistogramOptions = {},
  transform: ScaleDescriptor<number> = scaleTransform({ type: 'linear' })!
): ExprNode {
  const [min, max] = extent;
  const { offset = 0 } = options;
  const { apply, sqlApply, sqlInvert } = transform;
  const b = binSpec(apply(min), apply(max), options);
  const col = sqlApply(field);
  const alpha = (b.max - b.min) / b.steps;

  let expr = b.min === 0 ? col : sub(col, b.min);
  if (alpha !== 1) expr = div(expr, float64(alpha));
  expr = floor(offset ? add(offset, expr) : expr);
  if (alpha !== 1) expr = mul(alpha, expr);
  if (b.min !== 0) expr = add(b.min, expr);
  return sqlInvert(expr);
}
