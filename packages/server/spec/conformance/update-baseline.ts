// Refreshes known-failures/<server>.yaml from the last run's results. See
// src/baseline.ts for what changes; a result file with harness errors is
// refused outright.
//
// Run: CONFORMANCE_SERVER=go pnpm -F @uwdata/mosaic-server-spec conformance:baseline
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { observedFrom, refreshBaseline, type ResultRow } from './src/baseline.ts';
import { conformanceRoot } from './src/cases.ts';
import { knownFailuresPath } from './src/known.ts';
import { servers } from './servers/index.ts';

const server = process.env.CONFORMANCE_SERVER;
if (!server || !servers[server]) {
  throw new Error(`CONFORMANCE_SERVER must be one of ${Object.keys(servers).join(', ')}`);
}

const results = (name: string) => {
  const file = path.join(conformanceRoot, '.logs', `${name}-results.json`);
  return observedFrom(JSON.parse(readFileSync(file, 'utf8')) as ResultRow[], path.relative(process.cwd(), file));
};

const file = knownFailuresPath(server);
const source = readFileSync(file, 'utf8');
const inherits = parse(source).inherits as string | undefined;
const { text, changes, unfiled } = refreshBaseline(source, results(server), inherits ? results(inherits) : undefined);

for (const change of changes) console.log(change);
for (const [id, ids] of unfiled) {
  console.log(`UNFILED ${id}: ${ids.join(', ')} (add it under an area in ${path.relative(process.cwd(), file)})`);
}
if (changes.length) {
  writeFileSync(file, text);
  console.log(`wrote ${path.relative(process.cwd(), file)} (${changes.length} change${changes.length === 1 ? '' : 's'})`);
} else {
  console.log(`${path.relative(process.cwd(), file)} is up to date`);
}
