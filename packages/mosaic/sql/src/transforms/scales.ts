import type { ExprValue } from '../types.js';
import { LiteralNode } from '../ast/literal.js';
import { ExprNode } from '../ast/node.js';
import { epoch_ms } from '../functions/datetime.js';
import { literal } from '../functions/literal.js';
import { abs, exp, ln, log, sign, sqrt } from '../functions/numeric.js';
import { add, div, mul, pow, sub } from '../functions/operators.js';
import { asNode } from '../util/ast.js';
import { identity } from '../util/identity.js';
import { DateTimeValue } from './util/time-interval.js';

export interface ScaleTransform<T> {
  apply: (value: T) => number;
  invert: (value: number) => T;
  sqlApply: (value: ExprValue) => ExprNode;
  sqlInvert: (value: ExprNode) => ExprNode;
}

export type ScaleType =
  | 'identity'
  | 'linear'
  | 'log'
  | 'symlog'
  | 'sqrt'
  | 'pow'
  | 'time'
  | 'utc'
  | (string & Record<never, never>);

export type ScaleDomain = [number, number] | [Date, Date];

export interface ScaleOptions {
  /** The scale type, such as `'linear'`, `'log'`, etc. */
  type: ScaleType;
  /** The scale domain, as an array of start and end data values. */
  domain?: ScaleDomain;
  /**
   * The scale range, as an array of start and end screen pixels.
   * The range may be omitted for *identity* scales.
   */
  range?: [number, number];
  /** The base of the logarithm. For `'log'` scales only. */
  base?: number;
  /** The constant parameter. For `'symlog'` scales only. */
  constant?: number;
  /** The exponent parameter. For `'pow'` scales only. */
  exponent?: number;
}

export type Scale<T> = ScaleTransform<T> & ScaleOptions;

function scaleLinear(): ScaleTransform<number> {
  return {
    apply: identity,
    invert: identity,
    sqlApply: asNode,
    sqlInvert: identity
  };
}

function scaleLog({ base = null }: {base?: number | null} = { }): ScaleTransform<number> {
  if (base == null || base === Math.E) {
    return {
      apply: x => Math.sign(x) * Math.log(Math.abs(x)),
      invert: x => Math.sign(x) * Math.exp(Math.abs(x)),
      sqlApply: c => (c = asNode(c), mul(sign(c), ln(abs(c)))),
      sqlInvert: c => (c = asNode(c), mul(sign(c), exp(abs(c))))
    };
  } else if (base === 10) {
    return {
      apply: x => Math.sign(x) * Math.log10(Math.abs(x)),
      invert: x => Math.sign(x) * Math.pow(10, Math.abs(x)),
      sqlApply: c => (c = asNode(c), mul(sign(c), log(abs(c)))),
      sqlInvert: c => (c = asNode(c), mul(sign(c), pow(10, abs(c))))
    };
  } else {
    const b = +base;
    return {
      apply: x => Math.sign(x) * Math.log(Math.abs(x)) / Math.log(b),
      invert: x => Math.sign(x) * Math.pow(b, Math.abs(x)),
      sqlApply: c => (c = asNode(c), mul(sign(c), div(ln(abs(c)), ln(b)))),
      sqlInvert: c => (c = asNode(c), mul(sign(c), pow(b, abs(c))))
    };
  }
}

function scaleSymlog({ constant = 1 } = {}): ScaleTransform<number> {
  const _ = +constant;
  return {
    apply: x => Math.sign(x) * Math.log1p(Math.abs(x / _)),
    invert: x => Math.sign(x) * Math.expm1(Math.abs(x)) * _,
    sqlApply: c => (c = asNode(c), mul(sign(c), ln(add(1, abs(div(c, _)))))),
    sqlInvert: c => mul(sign(c), mul(sub(exp(abs(c)), 1), _))
  };
}

function scaleSqrt(): ScaleTransform<number> {
  return {
    apply: x => Math.sign(x) * Math.sqrt(Math.abs(x)),
    invert: x => Math.sign(x) * x * x,
    sqlApply: c => (c = asNode(c), mul(sign(c), sqrt(abs(c)))),
    sqlInvert: c => mul(sign(c), pow(c, 2))
  };
}

function scalePow({ exponent = 1 } = {}): ScaleTransform<number> {
  const e = +exponent;
  return {
    apply: x => Math.sign(x) * Math.pow(Math.abs(x), e),
    invert: x => Math.sign(x) * Math.pow(Math.abs(x), 1/e),
    sqlApply: c => (c = asNode(c), mul(sign(c), pow(abs(c), e))),
    sqlInvert: c => mul(sign(c), pow(abs(c), div(1, e)))
  };
}

function scaleTime(): ScaleTransform<DateTimeValue> {
  return {
    apply: x => Number(x),
    invert: x => new Date(x),
    sqlApply: c => c instanceof Date ? literal(+c)
      : isDateLiteral(c) ? literal(Number(c.value))
      : epoch_ms(c),
    sqlInvert: identity
  };
}

const scales = {
  identity: scaleLinear,
  linear: scaleLinear,
  log: scaleLog,
  symlog: scaleSymlog,
  sqrt: scaleSqrt,
  pow: scalePow,
  time: scaleTime,
  utc: scaleTime
};

export function scaleTransform<T>(options: ScaleOptions): Scale<T> {
  // @ts-expect-error scale type lookup
  const scale = scales[options.type];
  if (!scale) throw new Error(`Unrecognized scale type: ${options.type}`);
  return { ...options, ...scale(options) };
}

/**
 * Check if a value is a date-valued literal SQL AST node.
 * @param x The value to test.
 */
function isDateLiteral(x: unknown): x is LiteralNode {
  return x instanceof LiteralNode && x.value instanceof Date;
}
