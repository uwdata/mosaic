import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { clickhouseDatabase, clickhouseExamples } from "./examples.mjs";

const quote = (value) =>
  `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
const identifier = (value) => `"${value.replaceAll('"', '""')}"`;

// Raw SQL in YAML is not parsed into SQL ASTs, so dialect codegen cannot rewrite it.
// These overrides adapt incompatible SQL for ClickHouse.
const filters = {
  "wnba-shots": {
    shots: "NOT startsWith(type, 'Free Throw') AND season_type = 2",
  },
};

const queries = {
  normalize: {
    labels:
      "SELECT max(s.Date) AS Date, argMax(s.Close, s.Date) AS Close, s.Symbol AS Symbol FROM stocks AS s GROUP BY s.Symbol",
  },
};

export async function loadClickHouseFixtures(query) {
  for (const name of clickhouseExamples) {
    const spec = parse(
      await readFile(
        new URL(`../../specs/yaml/${name}.yaml`, import.meta.url),
        "utf8",
      ),
    );
    const database = clickhouseDatabase(name);
    await query(`CREATE DATABASE ${identifier(database)}`);
    for (const [table, definition] of Object.entries(spec.data ?? {})) {
      let select;
      if (typeof definition === "string") {
        select = queries[name]?.[table] ?? definition;
      } else {
        const {
          file,
          select: columns = ["*"],
          where: sourceFilter,
          ...options
        } = definition;
        const where = filters[name]?.[table] ?? sourceFilter;
        if (
          !file?.startsWith("data/") ||
          file.includes("..") ||
          !/\.(csv|parquet)$/.test(file) ||
          Object.keys(options).length
        ) {
          throw new Error(`Unsupported fixture definition: ${name}.${table}`);
        }
        const format = file.endsWith(".csv") ? "CSVWithNames" : "Parquet";
        select =
          `SELECT ${columns.join(", ")} FROM file(${quote(file.slice(5))}, '${format}')` +
          (where ? ` WHERE ${where}` : "");
      }
      await query(
        `CREATE TABLE ${identifier(table)} ENGINE = Memory AS ${select}`,
        database,
      );
    }
    console.log(`Loaded ${name}`);
  }
}
