export function jsType(type) {
  switch (type) {
    case 'BIGINT':
    case 'HUGEINT':
    case 'INTEGER':
    case 'SMALLINT':
    case 'TINYINT':
    case 'UBIGINT':
    case 'UINTEGER':
    case 'USMALLINT':
    case 'UTINYINT': // integers
    case 'DOUBLE':
    case 'FLOAT':
    case 'REAL':
    case 'DECIMAL':
      return 'number';
    case 'DATE':
    case 'TIMESTAMP':
    case 'TIMESTAMPTZ':
    case 'TIME':
      return 'date';
    case 'BOOLEAN':
      return 'boolean';
    case 'VARCHAR':
    case 'UUID':
      return 'string';
    case 'LIST':
      return 'array';
    case 'BLOB':
    case 'STRUCT':
    case 'MAP':
      return 'object';
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}
