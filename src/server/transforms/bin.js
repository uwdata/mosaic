export default function(q, sql, select, key, spec) {
  const { field, options: { min, max, steps, offset = 0 } } = spec;
  const delta = `(${field} - ${min})`;
  const alpha = `${(max - min) / steps}::DOUBLE`;
  const off = offset ? '1 + ' : '';
  select[key] = `${min} + ${alpha} * (${off}FLOOR(${delta} / ${alpha}))`;
}
