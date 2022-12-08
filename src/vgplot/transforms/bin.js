export function bin(spec, stats) {
  const { min, max } = stats.find(s => s.field === spec.field);
  return { min, max, ...spec };
}
