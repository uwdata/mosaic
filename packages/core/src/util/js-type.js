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
    case 'TIMESTAMP WITH TIME ZONE':
    case 'TIME':
    case 'TIMESTAMP_NS':
      return 'date';
    case 'BOOLEAN':
      return 'boolean';
    case 'VARCHAR':
    case 'UUID':
      return 'string';
    case 'ARRAY':
    case 'LIST':
      return 'array';
    case 'BLOB':
    case 'STRUCT':
    case 'MAP':
    case 'GEOMETRY':
      return 'object';
    default:
      if (type.startsWith('STRUCT') || type.startsWith('MAP')) {
        return 'object';
      } else if (type.endsWith(']')) {
        return 'array';
      }
      throw new Error(`Unsupported type: ${type}`);
  }
}
