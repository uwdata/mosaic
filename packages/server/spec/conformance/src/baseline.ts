import { isMap, isSeq, parseDocument, YAMLSeq } from 'yaml';

export interface ResultRow {
  id: string;
  outcome: string;
  reason?: string;
  violations?: string[];
}

export interface Refresh {
  text: string;
  changes: string[];
  unfiled: Map<string, string[]>;
  unverified: string[];
}

const same = (a: string[], b: string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// A harness error is an unknown observation, not evidence that a case
// passes, so a result set containing one cannot be used to rewrite anything.
export function observedFrom(rows: ResultRow[], label: string): Map<string, string[]> {
  const errors = rows.filter(r => r.outcome === 'error' || (r.outcome !== 'skipped' && !Array.isArray(r.violations)));
  if (errors.length) {
    throw new Error(`${label} contains ${errors.length} harness error${errors.length === 1 ? '' : 's'} (${errors.map(r => r.id).join(', ')}); fix them and rerun before refreshing the baseline`);
  }
  return new Map(rows.filter(r => r.outcome !== 'skipped').map(r => [r.id, r.violations!]));
}

// The same results read as the configuration another one inherits from. A
// case that configuration skips by capability (the skip carries its reason)
// has no inherited failures, so it counts as observed clean; a case a
// filtered run left out (no reason) stays absent and is reported unverified.
export function inheritedFrom(rows: ResultRow[], label: string): Map<string, string[]> {
  const observed = observedFrom(rows, label);
  for (const row of rows) {
    if (row.outcome === 'skipped' && row.reason) observed.set(row.id, []);
  }
  return observed;
}

// Rewrites the violation ids of cases already listed in a known-failures
// document from a run's results, removes cases that now pass or match the
// inherited baseline, and refreshes `passes`. Cases that fail but are not
// filed under any area are returned for a human to place. Only what a run
// observed is changed: a filtered run leaves the other cases' entries and
// exemptions alone, and a case the inherited run did not observe is
// reported as unverified rather than judged against an empty list.
export function refreshBaseline(
  source: string,
  observed: Map<string, string[]>,
  base: Map<string, string[]> | undefined
): Refresh {
  const doc = parseDocument(source);
  const inherits = doc.get('inherits') as string | undefined;
  if (inherits && !base) throw new Error(`the file inherits ${inherits} but no ${inherits} results were given`);
  const changes: string[] = [];
  const filed = new Set<string>();

  const failures = doc.get('failures');
  if (!isSeq(failures)) throw new Error('failures must be a list');
  for (const failure of failures.items) {
    if (!isMap(failure)) continue;
    const cases = failure.get('cases');
    if (!isMap(cases)) continue;
    for (const pair of [...cases.items]) {
      const id = String((pair.key as { value: unknown }).value ?? pair.key);
      const current = observed.get(id);
      if (current === undefined || (base && !base.has(id))) continue;
      filed.add(id);
      const listed = isSeq(pair.value) ? pair.value.items.map(v => String((v as { value: unknown }).value)) : [];
      if (current.length === 0 || (base && same(current, base.get(id)!))) {
        cases.delete(pair.key);
        changes.push(`removed ${id} (${current.length === 0 ? 'passes' : `same as ${inherits}`})`);
        continue;
      }
      // Keep `a|b` alternatives whose member was observed; everything else
      // is replaced by what the run saw.
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
        changes.push(`updated ${id}: ${listed.join(', ')} -> ${next.join(', ')}`);
      }
    }
  }

  const unverified = base ? [...observed.keys()].filter(id => !base.has(id)).sort() : [];

  if (base) {
    const passes = doc.get('passes');
    const listed = isSeq(passes) ? passes.items.map(v => String((v as { value: unknown }).value)) : [];
    const next = new Set(listed);
    for (const [id, ids] of observed) {
      const inherited = base.get(id);
      if (inherited === undefined) continue;
      if (inherited.length && ids.length === 0) next.add(id);
      else next.delete(id);
    }
    const passing = [...next].sort();
    if (!same(listed, passing)) {
      if (passing.length) doc.set('passes', doc.createNode(passing));
      else doc.delete('passes');
      changes.push(`passes: ${listed.join(', ') || '(none)'} -> ${passing.join(', ') || '(none)'}`);
    }
  }

  const unfiled = new Map<string, string[]>();
  for (const [id, ids] of observed) {
    if (filed.has(id) || ids.length === 0) continue;
    if (base && (!base.has(id) || same(ids, base.get(id)!))) continue;
    unfiled.set(id, ids);
  }

  return { text: doc.toString({ lineWidth: 0 }), changes, unfiled, unverified };
}
