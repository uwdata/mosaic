import { LiteralNode } from '../ast/literal.js';
import { epoch_ms } from '../functions/datetime.js';
import { literal } from '../functions/literal.js';
import { abs, exp, ln, log, sign, sqrt } from '../functions/numeric.js';
import { add, div, mul, pow, sub } from '../functions/operators.js';
import { asNode } from '../util/ast.js';

const identity = x => x;

function scaleLinear() {
  return {
    apply: identity,
    invert: identity,
    sqlApply: asNode,
    sqlInvert: identity
  };
}

function scaleLog({ base = null } = {}) {
  if (base == null || base === Math.E) {
    return {
      apply: Math.log,
      invert: Math.exp,
      sqlApply: c => ln(c),
      sqlInvert: c => exp(c)
    };
  } else if (base === 10) {
    return {
      apply: Math.log10,
      invert: x => Math.pow(10, x),
      sqlApply: c => log(c),
      sqlInvert: c => pow(10, c)
    };
  } else {
    const b = +base;
    return {
      apply: x => Math.log(x) / Math.log(b),
      invert: x => Math.pow(b, x),
      sqlApply: c => div(ln(c), ln(b)),
      sqlInvert: c => pow(b, c)
    };
  }
}

function scaleSymlog({ constant = 1 } = {}) {
  const _ = +constant;
  return {
    apply: x => Math.sign(x) * Math.log1p(Math.abs(x)),
    invert: x => Math.sign(x) * Math.exp(Math.abs(x) - _),
    sqlApply: c => (c = asNode(c), mul(sign(c), ln(add(_, abs(c))))),
    sqlInvert: c => mul(sign(c), sub(exp(abs(c)), _))
  };
}

function scaleSqrt() {
  return {
    apply: x => Math.sign(x) * Math.sqrt(Math.abs(x)),
    invert: x => Math.sign(x) * x * x,
    sqlApply: c => (c = asNode(c), mul(sign(c), sqrt(abs(c)))),
    sqlInvert: c => mul(sign(c), pow(c, 2))
  };
}

function scalePow({ exponent = 1 } = {}) {
  const e = +exponent;
  return {
    apply: x => Math.sign(x) * Math.pow(Math.abs(x), e),
    invert: x => Math.sign(x) * Math.pow(Math.abs(x), 1/e),
    sqlApply: c => (c = asNode(c), mul(sign(c), pow(abs(c), e))),
    sqlInvert: c => mul(sign(c), pow(abs(c), div(1, e)))
  };
}

function scaleTime() {
  return {
    apply: x => +x,
    invert: x => new Date(x),
    sqlApply: c => c instanceof Date ? literal(+c)
      : isDateLiteral(c) ? literal(+c.value)
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

export function scaleTransform(options) {
  const scale = scales[options.type];
  return scale ? { ...options, ...scale(options) } : null;
}

/**
 * Check if a value is a date-valued literal SQL AST node.
 * @param {*} x The value to test.
 * @returns {x is LiteralNode}
 */
function isDateLiteral(x) {
  return x instanceof LiteralNode && x.value instanceof Date;
}
