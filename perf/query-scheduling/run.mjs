/**
 * Run the query scheduling benchmark against one or more mosaic checkouts.
 *
 * Usage:
 *   node perf/query-scheduling/run.mjs [repoRoot ...]
 *
 * Each repoRoot must have installed dependencies and built dist output
 * (`pnpm install && npx tsc --build`). With no arguments, runs against the
 * current repository. With two or more roots, prints a comparison table
 * using the first root as the baseline.
 */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { runScenarios } from './scenarios.mjs';

async function importModules(root) {
  const url = rel => pathToFileURL(resolve(root, rel)).href;
  const core = await import(url('packages/mosaic/core/dist/src/index.js'));
  const sql = await import(url('packages/mosaic/sql/dist/src/index.js'));
  return { core, sql };
}

const roots = process.argv.slice(2);
if (roots.length === 0) roots.push(process.cwd());

const results = [];
for (const root of roots) {
  const { core, sql } = await importModules(root);
  process.stderr.write(`running scenarios: ${root}\n`);
  results.push({ root, scenarios: await runScenarios(core, sql) });
}

if (results.length === 1) {
  console.log(JSON.stringify(results[0], null, 2));
} else {
  const [baseline, ...others] = results;
  for (const other of others) {
    console.log(`baseline: ${baseline.root}`);
    console.log(`compare:  ${other.root}\n`);
    const rows = [];
    for (const [name, base] of Object.entries(baseline.scenarios)) {
      const comp = other.scenarios[name];
      for (const key of Object.keys(base)) {
        if (!/wall|Latency|Update|Done/i.test(key)) continue;
        rows.push({
          scenario: name,
          metric: key,
          [`baseline (ms)`]: +base[key].toFixed(1),
          [`compare (ms)`]: +comp[key].toFixed(1),
          speedup: +(base[key] / comp[key]).toFixed(2)
        });
      }
    }
    console.table(rows);
  }
}
