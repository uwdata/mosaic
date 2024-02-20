import { epoch_ms } from './datetime.js';
import { sql } from './expression.js';
import { asColumn } from './ref.js';

const scaleLinear = {
  apply: x => x,
  sql: asColumn
};

const scaleLog = {
  apply: Math.log,
  sql: c => sql`LN(${asColumn(c)})`
};

const scaleSymlog = {
  // TODO: support log constants other than 1?
  apply: x => Math.sign(x) * Math.log1p(Math.abs(x)),
  sql: c => (c = asColumn(c), sql`SIGN(${c}) * LN(1 + ABS(${c}))`)
};

const scaleSqrt = {
  apply: x => Math.sign(x) * Math.sqrt(Math.abs(x)),
  sql: c => (c = asColumn(c), sql`SIGN(${c}) * SQRT(ABS(${c}))`)
};

const scaleTime = {
  apply: x => +x,
  sql: c => c instanceof Date ? +c : epoch_ms(asColumn(c))
};

const scales = {
  linear: scaleLinear,
  log: scaleLog,
  symlog: scaleSymlog,
  sqrt: scaleSqrt,
  time: scaleTime,
  utc: scaleTime
};

export function scaleTransform(type) {
  return scales[type];
}
