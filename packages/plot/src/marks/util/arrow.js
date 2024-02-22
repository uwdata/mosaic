export const INTEGER = 2;
export const FLOAT = 3;
export const DECIMAL = 7;
export const TIMESTAMP = 10;

export function isArrowTable(values) {
  return typeof values?.getChild === 'function';
}

export function convertArrow(type) {
  const { typeId } = type;

  // map timestamp numbers to date objects
  if (typeId === TIMESTAMP) {
    return v => v == null ? v : new Date(v);
  }

  // map bignum to number
  if (typeId === INTEGER && type.bitWidth >= 64) {
    return v => v == null ? v : Number(v);
  }

  // otherwise use Arrow JS defaults
  return v => v;
}
