import { isMap, isSeq, parseDocument, type YAMLMap, YAMLSeq } from 'yaml';

export interface ResultRow {
  id: string;
  outcome: string;
  skip?: string;
  reason?: string;
  violations?: string[];
}

export interface Refresh {
  text: string;
  changes: string[];
  unfiled: Map<string, string[]>;
  unowned: Map<string, string[]>;
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
// case that configuration declines by capability or layer (the skip carries
// a category) has no inherited failures, so it counts as observed clean; a
// case a filtered run left out (no category) stays absent and is reported
// unverified.
export function inheritedFrom(rows: ResultRow[], label: string): Map<string, string[]> {
  const observed = observedFrom(rows, label);
  for (const row of rows) {
    if (row.outcome === 'skipped' && row.skip) observed.set(row.id, []);
  }
  return observed;
}

interface Occurrence {
  area: string;
  cases: YAMLMap;
  key: unknown;
  listed: string[];
}

// Rewrites the violation ids of cases already listed in a known-failures
// document from a run's results, removes cases that now pass or match the
// inherited baseline, and refreshes `passes`. Cases that fail but are not
// filed under any area are returned for a human to place. Only what a run
// observed is changed: a filtered run leaves the other cases' entries and
// exemptions alone, and a case the inherited run did not observe is
// reported as unverified rather than judged against an empty list. A case
// listed under several areas is updated as a whole: each area keeps the ids
// it owned that are still observed, and ids no area owns are reported
// rather than copied into every area.
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
  const unowned = new Map<string, string[]>();

  const failures = doc.get('failures');
  if (!isSeq(failures)) throw new Error('failures must be a list');
  const occurrences = new Map<string, Occurrence[]>();
  for (const failure of failures.items) {
    if (!isMap(failure)) continue;
    const cases = failure.get('cases');
    if (!isMap(cases)) continue;
    for (const pair of cases.items) {
      const id = String((pair.key as { value: unknown }).value ?? pair.key);
      const listed = isSeq(pair.value) ? pair.value.items.map(v => String((v as { value: unknown }).value)) : [];
      const list = occurrences.get(id) ?? [];
      list.push({ area: String(failure.get('area')), cases, key: pair.key, listed });
      occurrences.set(id, list);
    }
  }

  for (const [id, list] of occurrences) {
    const current = observed.get(id);
    if (current === undefined || (base && !base.has(id))) continue;
    filed.add(id);
    if (current.length === 0 || (base && same(current, base.get(id)!))) {
      for (const o of list) o.cases.delete(o.key);
      changes.push(`removed ${id} (${current.length === 0 ? 'passes' : `same as ${inherits}`})`);
      continue;
    }
    // Each area keeps the entries it listed that the run still observed,
    // including an `a|b` alternative with exactly one member seen. Ids no
    // area listed go to the only area when there is one, else are reported.
    const remaining = new Set(current);
    const kept = list.map(o => {
      const next: string[] = [];
      for (const entry of o.listed) {
        const members = entry.split('|');
        const hit = members.filter(m => remaining.has(m));
        if (hit.length === 1) {
          next.push(entry);
          remaining.delete(hit[0]);
        }
      }
      return next;
    });
    if (remaining.size) {
      if (list.length === 1) kept[0].push(...remaining);
      else unowned.set(id, [...remaining]);
    }
    list.forEach((o, i) => {
      const next = kept[i];
      if (same(o.listed, next)) return;
      const where = list.length > 1 ? ` (${o.area})` : '';
      if (next.length === 0) {
        o.cases.delete(o.key);
        changes.push(`removed ${id}${where}: ${o.listed.join(', ')} no longer observed`);
        return;
      }
      const seq = new YAMLSeq();
      for (const v of next) seq.add(doc.createNode(v));
      o.cases.set(o.key, seq);
      changes.push(`updated ${id}${where}: ${o.listed.join(', ')} -> ${next.join(', ')}`);
    });
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

  return { text: doc.toString({ lineWidth: 0 }), changes, unfiled, unowned, unverified };
}
