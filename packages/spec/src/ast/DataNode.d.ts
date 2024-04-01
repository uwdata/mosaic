export type SpecDataObjects = object[];

export type SpecDataDefinition =
  | SpecDataQuery
  | SpecDataArray
  | SpecDataTable
  | SpecDataParquet
  | SpecDataCSV
  | SpecDataSpatial
  | SpecDataJSON
  | SpecDataJSONObjects;

export type SpecDataQuery = string;

export type SpecDataArray = Array<any>;

export type SpecDataBaseOptions = {
  select?: string[];
  where?: string | string[];
  view?: boolean;
  temp?: boolean;
  replace?: boolean;
};

export type SpecDataObject =
  | SpecDataTable;

export type SpecDataTable = {
  type: 'table';
  query: string;
} & SpecDataBaseOptions;

export type SpecDataParquet =
  & (
      { type: 'parquet'; file: string; } |
      { file: `${string}.parquet` }
    )
  & SpecDataBaseOptions;

export type SpecDataCSV =
  & (
    { type: 'csv'; file: string; } |
    { file: `${string}.csv` }
  )
  & SpecDataCSVOptions
  & SpecDataBaseOptions;

export interface SpecDataCSVOptions {
  delimiter?: string,
  sample_size?: number;
}

export type SpecDataSpatial =
  & {
      type: 'spatial',
      file: string,
    }
  & SpecDataSpatialOptions
  & SpecDataBaseOptions;

export type SpecDataSpatialOptions = {
  [key: string]: any
};

export type SpecDataJSON =
  & (
    { type: 'json'; file: string; } |
    { file: `${string}.json` }
  )
  & SpecDataJSONOptions
  & SpecDataBaseOptions;

export type SpecDataJSONOptions = {
  [key: string]: any
};

export type SpecDataJSONObjects =
  & {
      type?: 'json',
      data: SpecDataObjects
    }
  & SpecDataBaseOptions;
