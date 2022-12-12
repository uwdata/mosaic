export default function(q, sql, select, key, spec) {
  const { field, min, max, options: { steps = 20, offset = 0 } = {} } = spec;
  const delta = `(${field} - ${min})`;
  const span = `(${max} - ${min})`;
  const step = `${steps}::DOUBLE`;
  const off = offset ? '1 + ' : '';
  select[key] = `${min} + (${span} / ${step}) * (${off}FLOOR(${step} * ${delta} / ${span}))`;
}
