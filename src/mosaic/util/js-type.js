import * as Type from '../../duckdb/DuckDBTypes.js';

export function jsType(type) {
  switch (type) {
    case Type.BIGINT:
    case Type.HUGEINT:
    case Type.INTEGER:
    case Type.SMALLINT:
    case Type.TINYINT:
    case Type.UBIGINT:
    case Type.UINTEGER:
    case Type.USMALLINT:
    case Type.UTINYINT: // integers
    case Type.DOUBLE:
    case Type.REAL:
    case Type.DECIMAL:
      return 'number';
    case Type.DATE:
    case Type.TIMESTAMP:
    case Type.TIMESTAMPTZ:
    case Type.TIME:
      return 'date';
    case Type.BOOLEAN:
      return 'boolean';
    case Type.VARCHAR:
    case Type.UUID:
      return 'string';
    case Type.LIST:
      return 'array';
    case Type.BLOB:
    case Type.STRUCT:
    case Type.MAP:
      return 'object';
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}
