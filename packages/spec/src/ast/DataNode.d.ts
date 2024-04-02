export interface SpecDataBaseOptions {
  select?: string[];
  where?: string | string[];
  view?: boolean;
  temp?: boolean;
  replace?: boolean;
}

export type SpecDataQuery = string;

export type SpecDataArray = Array<any>;

export interface SpecDataFile {
  /**
   * The data file to load. If no type option is provided,
   * the file suffix must be one of `.csv`, `.json`, or `.parquet`.
   */
  file: `${string}.parquet` | `${string}.csv` | `${string}.json`;
}

export interface SpecDataTable extends SpecDataBaseOptions {
  type: 'table';
  query: string;
}

export interface SpecDataParquet extends SpecDataBaseOptions {
  type: 'parquet';
  file: string;
}

export interface SpecDataCSV extends SpecDataBaseOptions {
  type: 'csv';
  file: string;
  delimiter?: string,
  sample_size?: number;
}

export interface SpecDataSpatial extends SpecDataBaseOptions {
  type: 'spatial';
  file: string;
  layer?: string;
}

export interface SpecDataJSON extends SpecDataBaseOptions {
  type: 'json';
  file: string;
}

export interface SpecDataJSONObjects extends SpecDataBaseOptions {
  type?: 'json';
  data: object[];
}

export type SpecDataDefinition =
  | SpecDataQuery
  | SpecDataArray
  | SpecDataFile
  | SpecDataTable
  | SpecDataParquet
  | SpecDataCSV
  | SpecDataSpatial
  | SpecDataJSON
  | SpecDataJSONObjects;
