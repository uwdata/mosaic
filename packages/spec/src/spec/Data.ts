export interface DataBaseOptions {
  /**
   * A list of column names to extract upon load.
   * Any other columns are omitted.
   */
  select?: string[];
  /**
   * A filter (WHERE clause) to apply upon load.
   * Only rows that pass the filted are included.
   */
  where?: string | string[];
  /**
   * Flag (default `false`) to generate a view instead of a table.
   */
  view?: boolean;
  /**
   * Flag (default `true`) to generate a temporary view or table.
   */
  temp?: boolean;
  /**
   * Flag (default `true`) to replace an existing table of the same name.
   * If `false`, creating a new table with an existing name raises an error.
   */
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

/**
 * A data definition that loads an external data file.
 */
export interface DataFile extends DataBaseOptions {
  /**
   * The data file to load. If no type option is provided,
   * the file suffix must be one of `.csv`, `.json`, or `.parquet`.
   */
  file: `${string}.parquet` | `${string}.csv` | `${string}.json`;
}

/**
 * A data definition that queries an existing table.
 */
export interface DataTable extends DataBaseOptions {
  /**
   * The data source type. One of:
   * - `"table"`: Define a new table based on a SQL query.
   * - `"csv"`: Load a comma-separated values (CSV) file.
   * - `"json"`: Load JavaScript Object Notation (json) data.
   * - `"parquet"`: Load a Parquet file.
   * - `"spatial"`: Load a spatial data file format via `ST_Read`.
   */
  type: 'table';
  /**
   * A SQL query string for the desired table data.
   */
  query: string;
}

/**
 * A data definition that loads a parquet file.
 */
export interface DataParquet extends DataBaseOptions {
  /**
   * The data source type. One of:
   * - `"table"`: Define a new table based on a SQL query.
   * - `"csv"`: Load a comma-separated values (CSV) file.
   * - `"json"`: Load JavaScript Object Notation (json) data.
   * - `"parquet"`: Load a Parquet file.
   * - `"spatial"`: Load a spatial data file format via `ST_Read`.
   */
  type: 'parquet';
  /**
   * The file path for the dataset to load.
   */
  file: string;
}

/**
 * A data definition that loads a csv file.
 */
export interface DataCSV extends DataBaseOptions {
  /**
   * The data source type. One of:
   * - `"table"`: Define a new table based on a SQL query.
   * - `"csv"`: Load a comma-separated values (CSV) file.
   * - `"json"`: Load JavaScript Object Notation (json) data.
   * - `"parquet"`: Load a Parquet file.
   * - `"spatial"`: Load a spatial data file format via `ST_Read`.
   */
  type: 'csv';
  /**
   * The file path for the dataset to load.
   */
  file: string;
  /**
   * The column delimiter string. If not specified, DuckDB will try to infer
   * the delimiter automatically.
   */
  delimiter?: string,
  /**
   * The sample size, in table rows, to consult for type inference.
   * Set to `-1` to process all rows in the dataset.
   */
  sample_size?: number;
}

/**
 * A data definition that loads a supported spatial data file format.
 */
export interface DataSpatial extends DataBaseOptions {
  /**
   * The data source type. One of:
   * - `"table"`: Define a new table based on a SQL query.
   * - `"csv"`: Load a comma-separated values (CSV) file.
   * - `"json"`: Load JavaScript Object Notation (json) data.
   * - `"parquet"`: Load a Parquet file.
   * - `"spatial"`: Load a spatial data file format via `ST_Read`.
   */
  type: 'spatial';
  /**
   * The file path for the spatial dataset to load. See the [DuckDB spatial
   * documention][1] for more information on supported file types.
   *
   * [1]: https://duckdb.org/docs/extensions/spatial.html#st_read--read-spatial-data-from-files
   */
  file: string;
  /**
   * The named layer to load from the file. For example, in a TopoJSON file
   * the layer is the named object to extract. For Excel spreadsheet files,
   * the layer is the name of the worksheet to extract.
   */
  layer?: string;
}

export interface DataJSON extends DataBaseOptions {
  /**
   * The data source type. One of:
   * - `"table"`: Define a new table based on a SQL query.
   * - `"csv"`: Load a comma-separated values (CSV) file.
   * - `"json"`: Load JavaScript Object Notation (json) data.
   * - `"parquet"`: Load a Parquet file.
   * - `"spatial"`: Load a spatial data file format via `ST_Read`.
   */
  type: 'json';
  /**
   * The file path for the dataset to load.
   */
  file: string;
}

export interface DataJSONObjects extends DataBaseOptions {
  /**
   * The data source type. One of:
   * - `"table"`: Define a new table based on a SQL query.
   * - `"csv"`: Load a comma-separated values (CSV) file.
   * - `"json"`: Load JavaScript Object Notation (json) data.
   * - `"parquet"`: Load a Parquet file.
   * - `"spatial"`: Load a spatial data file format via `ST_Read`.
   */
  type?: 'json';
  /**
   * An array of inline objects in JSON-style format.
   */
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
