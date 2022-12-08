import { linearRegression } from '../../query/linear-regression.js';

export default function(spec, sql) {
  const { x, y } = spec;
  return linearRegression(`(${sql})`, x, y);
}
