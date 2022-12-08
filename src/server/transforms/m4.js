import { m4 } from '../../query/m4.js';

export default function(spec, sql, jq) {
  const { field, value, width, range } = spec;
  const [ min, max ] = jq.where ? jq.where[0].value : range;
  return m4(`(${sql})`, field, value, field, min, max, width);
}
