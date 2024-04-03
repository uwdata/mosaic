export interface DataBaseOptions {
  select?: string[];
  where?: string | string[];
  view?: boolean;
  temp?: boolean;
  replace?: boolean;
}

/**
 * A SQL query defining a new temporary database table.
 */
export type DataQuery = string;

/**
 * An inline array of data objects to treat as JSON data.
 */
export type DataArray = object[];

export interface DataFile {
  /**
   * The data file to load. If no type option is provided,
   * the file suffix must be one of `.csv`, `.json`, or `.parquet`.
   */
  file: `${string}.parquet` | `${string}.csv` | `${string}.json`;
}

export interface DataTable extends DataBaseOptions {
  type: 'table';
  query: string;
}

export interface DataParquet extends DataBaseOptions {
  type: 'parquet';
  file: string;
}

export interface DataCSV extends DataBaseOptions {
  type: 'csv';
  file: string;
  delimiter?: string,
  sample_size?: number;
}

export interface DataSpatial extends DataBaseOptions {
  type: 'spatial';
  file: string;
  layer?: string;
}

export interface DataJSON extends DataBaseOptions {
  type: 'json';
  file: string;
}

export interface DataJSONObjects extends DataBaseOptions {
  type?: 'json';
  data: object[];
}

export type DataDefinition =
  | DataQuery
  | DataArray
  | DataFile
  | DataTable
  | DataParquet
  | DataCSV
  | DataSpatial
  | DataJSON
  | DataJSONObjects;
