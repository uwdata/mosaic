import { binInterp } from '../../query/bin-interp.js';

export default function(spec, sql) {
  const { field, weight, bins, range } = spec;
  return binInterp(`(${sql})`, field, range[0], range[1], bins, weight);
}
