import { epoch_ms } from './datetime.js';
import { sql } from './expression.js';
import { asColumn } from './ref.js';

const identity = x => x;

function scaleLinear() {
  return {
    apply: identity,
    invert: identity,
    sqlApply: asColumn,
    sqlInvert: identity
  };
}

function scaleLog({ base = null } = {}) {
  if (base == null || base === Math.E) {
    return {
      apply: Math.log,
      invert: Math.exp,
      sqlApply: c => sql`LN(${asColumn(c)})`,
      sqlInvert: c => sql`EXP(${c})`
    };
  } else if (base === 10) {
    return {
      apply: Math.log10,
      invert: x => Math.pow(10, x),
      sqlApply: c => sql`LOG(${asColumn(c)})`,
      sqlInvert: c => sql`POW(10, ${c})`
    };
  } else {
    const b = +base;
    return {
      apply: x => Math.log(x) / Math.log(b),
      invert: x => Math.pow(b, x),
      sqlApply: c => sql`LN(${asColumn(c)}) / LN(${b})`,
      sqlInvert: c => sql`POW(${b}, ${c})`
    };
  }
}

function scaleSymlog({ constant = 1 } = {}) {
  const _ = +constant;
  return {
    apply: x => Math.sign(x) * Math.log1p(Math.abs(x)),
    invert: x => Math.sign(x) * Math.exp(Math.abs(x) - _),
    sqlApply: c => (c = asColumn(c), sql`SIGN(${c}) * LN(${_} + ABS(${c}))`),
    sqlInvert: c => sql`SIGN(${c}) * (EXP(ABS(${c})) - ${_})`
  };
}

function scaleSqrt() {
  return {
    apply: x => Math.sign(x) * Math.sqrt(Math.abs(x)),
    invert: x => Math.sign(x) * x * x,
    sqlApply: c => (c = asColumn(c), sql`SIGN(${c}) * SQRT(ABS(${c}))`),
    sqlInvert: c => sql`SIGN(${c}) * (${c}) ** 2`
  };
}

function scalePow({ exponent = 1 } = {}) {
  const e = +exponent;
  return {
    apply: x => Math.sign(x) * Math.pow(Math.abs(x), e),
    invert: x => Math.sign(x) * Math.pow(Math.abs(x), 1/e),
    sqlApply: c => (c = asColumn(c), sql`SIGN(${c}) * POW(ABS(${c}), ${e})`),
    sqlInvert: c => sql`SIGN(${c}) * POW(ABS(${c}), 1/${e})`
  };
}

function scaleTime() {
  return {
    apply: x => +x,
    invert: x => new Date(x),
    sqlApply: c => c instanceof Date ? +c : epoch_ms(asColumn(c)),
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
