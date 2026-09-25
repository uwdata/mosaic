// Refreshes known-failures/<server>.yaml from the last run's results: cases
// already listed get their violation ids replaced with what was observed,
// cases that no longer fail are removed, and cases that fail but are not
// filed under any area are reported for a human to place.
//
// Run: CONFORMANCE_SERVER=go pnpm -F @uwdata/mosaic-server-spec conformance:baseline
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { isMap, isSeq, parseDocument, YAMLSeq } from 'yaml';
import { conformanceRoot } from './src/cases.ts';
import { knownFailuresPath } from './src/known.ts';
import { servers } from './servers/index.ts';

const server = process.env.CONFORMANCE_SERVER;
if (!server || !servers[server]) {
  throw new Error(`CONFORMANCE_SERVER must be one of ${Object.keys(servers).join(', ')}`);
}

interface Row { id: string; outcome: string; violations?: string[] }
const results = JSON.parse(readFileSync(path.join(conformanceRoot, '.logs', `${server}-results.json`), 'utf8')) as Row[];
const observed = new Map(results.filter(r => r.outcome !== 'skipped').map(r => [r.id, r.violations ?? []]));

const file = knownFailuresPath(server);
const doc = parseDocument(readFileSync(file, 'utf8'));
const inherits = doc.get('inherits') as string | undefined;
const base = inherits
  ? new Map((JSON.parse(readFileSync(path.join(conformanceRoot, '.logs', `${inherits}-results.json`), 'utf8')) as Row[])
    .filter(r => r.outcome !== 'skipped').map(r => [r.id, r.violations ?? []]))
  : undefined;
const same = (a: string[], b: string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

const filed = new Set<string>();
let changed = 0;
const failures = doc.get('failures');
if (!isSeq(failures)) throw new Error(`${file}: failures must be a list`);
for (const failure of failures.items) {
  if (!isMap(failure)) continue;
  const cases = failure.get('cases');
  if (!isMap(cases)) continue;
  for (const pair of [...cases.items]) {
    const id = String((pair.key as { value: unknown }).value ?? pair.key);
    const current = observed.get(id);
    if (current === undefined) continue;
    filed.add(id);
    const listed = isSeq(pair.value) ? pair.value.items.map(v => String((v as { value: unknown }).value)) : [];
    const inheritedSame = base ? same(current, base.get(id) ?? []) : false;
    if (current.length === 0 || inheritedSame) {
      cases.delete(pair.key);
      changed++;
      console.log(`removed ${id} (${current.length === 0 ? 'passes' : `same as ${inherits}`})`);
      continue;
    }
    // Keep `a|b` alternatives whose member was observed; everything else is
    // replaced by what the run saw.
    const remaining = new Set(current);
    const next: string[] = [];
    for (const entry of listed) {
      const members = entry.split('|');
      const hit = members.filter(m => remaining.has(m));
      if (members.length > 1 && hit.length === 1) {
        next.push(entry);
        remaining.delete(hit[0]);
      }
    }
    next.push(...remaining);
    if (!same(listed, next)) {
      const seq = new YAMLSeq();
      for (const v of next) seq.add(doc.createNode(v));
      cases.set(pair.key, seq);
      changed++;
      console.log(`updated ${id}: ${listed.join(', ')} -> ${next.join(', ')}`);
    }
  }
}

if (base) {
  const passes = doc.get('passes');
  const passing = [...base.entries()].filter(([id, ids]) => ids.length && observed.get(id)?.length === 0).map(([id]) => id);
  const listed = isSeq(passes) ? passes.items.map(v => String((v as { value: unknown }).value)) : [];
  if (!same(listed, passing)) {
    doc.set('passes', doc.createNode(passing));
    changed++;
    console.log(`passes: ${listed.join(', ') || '(none)'} -> ${passing.join(', ') || '(none)'}`);
  }
}

for (const [id, ids] of observed) {
  if (filed.has(id) || ids.length === 0) continue;
  if (base && same(ids, base.get(id) ?? [])) continue;
  console.log(`UNFILED ${id}: ${ids.join(', ')} (add it under an area in ${path.relative(process.cwd(), file)})`);
}

if (changed) {
  writeFileSync(file, doc.toString({ lineWidth: 0 }));
  console.log(`wrote ${path.relative(process.cwd(), file)} (${changed} change${changed === 1 ? '' : 's'})`);
} else {
  console.log(`${path.relative(process.cwd(), file)} is up to date`);
}
