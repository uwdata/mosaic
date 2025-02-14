/**
 * Maps a SQL data type to its corresponding JavaScript type.
 * @param {string} type The name of a SQL data type
 * @returns {import('../types.js').JSType} The corresponding JavaScript type name
 * @throws {Error} Throws an error if the given SQL type name is unsupported or unrecognized.
 */
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
    case 'JSON':
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
      if (type.startsWith('DECIMAL')) {
        return 'number';
      } else if (type.startsWith('STRUCT') || type.startsWith('MAP')) {
        return 'object';
      } else if (type.endsWith(']')) {
        return 'array';
      }
      throw new Error(`Unsupported type: ${type}`);
  }
}
