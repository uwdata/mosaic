import { create } from "./create";
import { sqlFrom } from "./sql-from";

type LoadOptions = {
  select?: string[];
  where?: string;
  view?: boolean;
  temp?: boolean;
  replace?: boolean;
  auto_detect?: boolean;
  sample_size?: number;
  json_format?: "auto" | "array-of-objects" | "lines";
};

export function load(
  method: string,
  tableName: string,
  fileName: string,
  options: LoadOptions = {},
  defaults: LoadOptions = {}
): string {
  const { select = ["*"], where, view, temp, replace, ...file } = options;
  const params = parameters({ ...defaults, ...file });
  const read = `${method}('${fileName}'${params ? ", " + params : ""})`;
  const filter = where ? ` WHERE ${where}` : "";
  const query = `SELECT ${select.join(", ")} FROM ${read}${filter}`;
  return create(tableName, query, { view, temp, replace });
}

export function loadCSV(
  tableName: string,
  fileName: string,
  options: LoadOptions
): string {
  return load("read_csv", tableName, fileName, options, {
    auto_detect: true,
    sample_size: -1,
  });
}

export function loadJSON(
  tableName: string,
  fileName: string,
  options: LoadOptions
): string {
  return load("read_json", tableName, fileName, options, {
    auto_detect: true,
    json_format: "auto",
  });
}

export function loadParquet(
  tableName: string,
  fileName: string,
  options: LoadOptions
): string {
  return load("read_parquet", tableName, fileName, options);
}

export function loadObjects(
  tableName: string,
  data: { [key: string]: any }[],
  options: LoadOptions = {}
) {
  const { select = ["*"], ...opt } = options;
  const values = sqlFrom(data);
  const query =
    select.length === 1 && select[0] === "*"
      ? values
      : `SELECT ${select} FROM ${values}`;
  return create(tableName, query, opt);
}

function parameters(options: LoadOptions): string {
  return Object.entries(options)
    .map(([key, value]) => `${key}=${toDuckDBValue(value)}`)
    .join(", ");
}

function toDuckDBValue(value: any): string {
  switch (typeof value) {
    case "boolean":
      return String(value);
    case "string":
      return `'${value}'`;
    case "undefined":
    case "object":
      if (value == null) {
        return "NULL";
      } else if (Array.isArray(value)) {
        return "[" + value.map((v) => toDuckDBValue(v)).join(", ") + "]";
      } else {
        return (
          "{" +
          Object.entries(value)
            .map(([k, v]) => `'${k}': ${toDuckDBValue(v)}`)
            .join(", ") +
          "}"
        );
      }
    default:
      return value;
  }
}
