import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { clickhouseDatabase, clickhouseRemoteExamples, clickhouseSupports } from './examples.mjs';

const specsDir = join(import.meta.dirname, '../../specs/yaml');

export const exampleNames = (await readdir(specsDir))
  .filter((file) => file.endsWith('.yaml'))
  .map((file) => file.slice(0, -'.yaml'.length))
  .sort();

const quote = (value) =>
  `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
const identifier = (value) => `"${value.replaceAll('"', '""')}"`;

// Raw SQL in YAML is not parsed into SQL ASTs, so dialect codegen cannot rewrite it.
// These overrides adapt incompatible SQL for ClickHouse.
const filters = {
  'wnba-shots': {
    shots: "NOT startsWith(type, 'Free Throw') AND season_type = 2",
  },
};

const remote = (file) =>
  `url('https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/${file}', 'Parquet')`;

const flights10m = `SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM ${remote('flights-10m.parquet')}`;

// ClickHouse SAMPLE needs a MergeTree table with SAMPLE BY.
const sample = (fraction) => `SELECT * FROM flights10m WHERE randCanonical() < ${fraction}`;

const queries = {
  normalize: {
    labels:
      'SELECT max(s.Date) AS Date, argMax(s.Close, s.Date) AS Close, s.Symbol AS Symbol FROM stocks AS s GROUP BY s.Symbol',
  },
  'flights-10m': { flights10m },
  'linear-regression-10m': {
    flights10m,
    flights10p: sample(0.1),
    flights5p: sample(0.05),
    flights1p: sample(0.01),
  },
  gaia: {
    gaia: `WITH prep AS (
      SELECT radians((-l + 540) % 360 - 180) AS lambda, radians(b) AS phi,
        asin(sqrt(3)/2 * sin(phi)) AS t, pow(t, 2) AS t2, pow(t2, 3) AS t6, *
      FROM ${remote('gaia-5m.parquet')}
      WHERE parallax BETWEEN -5 AND 20 AND phot_g_mean_mag IS NOT NULL AND bp_rp IS NOT NULL
    )
    SELECT
      (1.340264 * "lambda" * cos(t)) / (sqrt(3)/2 * (1.340264 + (-0.081106 * 3 * t2) + (t6 * (0.000893 * 7 + 0.003796 * 9 * t2)))) AS u,
      t * (1.340264 + (-0.081106 * t2) + (t6 * (0.000893 + 0.003796 * t2))) AS v,
      * EXCEPT(t, t2, t6)
    FROM prep`,
  },
};

export const remoteTimeout = 300_000;

export async function loadClickHouseFixtures(query, { remote = false } = {}) {
  const names = exampleNames.filter(
    (name) => clickhouseSupports(name) && clickhouseRemoteExamples.includes(name) === remote,
  );
  for (const name of names) {
    try {
      await loadClickHouseExample(name, query);
      console.log(`Loaded ${name}`);
    } catch (error) {
      if (!remote) throw error;
      await query(`DROP DATABASE IF EXISTS ${identifier(clickhouseDatabase(name))}`).catch(() => {});
      console.warn(`Skipping ${name}: ${error.message.split('\n')[0]}`);
    }
  }
}

export async function loadClickHouseExample(name, query) {
  const spec = parse(await readFile(join(specsDir, `${name}.yaml`), 'utf8'));
  const database = clickhouseDatabase(name);
  await query(`CREATE DATABASE ${identifier(database)}`);
  for (const [table, definition] of Object.entries(spec.data ?? {})) {
    let select;
    if (typeof definition === 'string') {
      select = queries[name]?.[table] ?? definition;
    } else {
      const {
        file,
        select: columns = ['*'],
        where: sourceFilter,
        ...options
      } = definition;
      const where = filters[name]?.[table] ?? sourceFilter;
      if (
        !file?.startsWith('data/') ||
        file.includes('..') ||
        !/\.(csv|parquet)$/.test(file) ||
        Object.keys(options).length
      ) {
        throw new Error(`Unsupported fixture definition: ${name}.${table}`);
      }
      const format = file.endsWith('.csv') ? 'CSVWithNames' : 'Parquet';
      select =
        `SELECT ${columns.join(', ')} FROM file(${quote(file.slice(5))}, '${format}')` +
        (where ? ` WHERE ${where}` : '');
    }
    await query(
      `CREATE TABLE ${identifier(table)} ENGINE = Memory AS ${select}`,
      database,
      clickhouseRemoteExamples.includes(name) ? remoteTimeout : undefined,
    );
  }
}
