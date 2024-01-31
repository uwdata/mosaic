export function isArrowTable(values) {
  return typeof values?.getChild === 'function';
}
