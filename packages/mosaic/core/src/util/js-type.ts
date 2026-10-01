import { duckDBCodeGenerator, type JSType } from '@uwdata/mosaic-sql';

/**
 * Maps a DuckDB SQL data type to its corresponding JavaScript type.
 * @param type The name of a SQL data type
 * @returns The corresponding JavaScript type name
 * @throws Throws an error if the given SQL type name is unsupported or unrecognized.
 */
export function jsType(type: string): JSType {
  return duckDBCodeGenerator.jsType(type);
}
