import { linearRegression } from '../../query/linear-regression.js';

export default function(spec, sql) {
  const { x, y, groupby } = spec;
  return linearRegression(`(${sql})`, x, y, groupby);
}
