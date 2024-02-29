export const INTEGER = 2;
export const FLOAT = 3;
export const DECIMAL = 7;
export const TIMESTAMP = 10;

export function isArrowTable(values) {
  return typeof values?.getChild === 'function';
}

export function convertArrowType(type) {
  switch (type.typeId) {
    case INTEGER:
    case FLOAT:
    case DECIMAL:
      return Float64Array;
    default:
      return Array;
  }
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

export function convertArrowColumn(column) {
  const { type } = column;
  const { typeId } = type;

  // map bignum to number
  if (typeId === INTEGER && type.bitWidth >= 64) {
    const size = column.length;
    const array = new Float64Array(size);
    for (let row = 0; row < size; ++row) {
      const v = column.get(row);
      array[row] = v == null ? NaN : Number(v);
    }
    return array;
  }

  // otherwise use Arrow JS defaults
  return column.toArray();
}
