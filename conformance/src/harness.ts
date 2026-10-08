import { it } from 'vitest';
import { casesOf, target, type Target } from '../implementations/index.ts';
import { loadCases } from './cases.ts';
import { areasFor, expectedViolations, loadKnownFailures, type KnownFailures } from './known.ts';
import type { ConformanceCase, Violation } from './types.ts';

export const annotationTypes = {
  known: 'known-failure',
  observed: 'observed',
  regression: 'regression',
  resolved: 'resolved'
} as const;

export interface Harness {
  config: Target;
  cases: ConformanceCase[];
  known: KnownFailures;
  expected: Map<string, Set<string>>;
}

export function createHarness(): Harness {
  const config = target(process.env.CONFORMANCE_TARGET);
  const cases = loadCases(config);
  const known = loadKnownFailures(config.name, new Set(cases.map(c => c.id)), casesOf);
  return { config, cases, known, expected: expectedViolations(known) };
}

// Why a case does not run on this target. The category is what the results
// file and the baseline updater read; the text is for people.
export type SkipCategory = 'capability' | 'layer';

export interface Skip {
  category: SkipCategory;
  reason: string;
}

export function skipReason(config: Target, c: ConformanceCase): Skip | undefined {
  if (!c.applicable) return { category: 'layer', reason: `${c.layer} transport, case is ${c.definition.layers?.join('/') ?? 'wire'} only` };
  const missing = (c.definition.requires ?? []).filter(cap => !config.capabilities.has(cap));
  const present = (c.definition.unless ?? []).filter(cap => config.capabilities.has(cap));
  if (missing.length) return { category: 'capability', reason: `requires ${missing.join(', ')}` };
  if (present.length) return { category: 'capability', reason: `only when ${present.join(', ')} is unavailable` };
  return undefined;
}

// The note is the only channel from a skipped test to the reporter, so the
// category travels as a fixed prefix that the reporter parses back out.
export function skipNote(skip: Skip) {
  return `${skip.category}: ${skip.reason}`;
}

export function parseSkipNote(note: string | undefined): Skip | undefined {
  const match = note === undefined ? null : /^(capability|layer): (.*)$/s.exec(note);
  return match ? { category: match[1] as SkipCategory, reason: match[2] } : undefined;
}

export interface Verdict {
  known: Violation[];
  regressions: Violation[];
  resolved: string[];
}

// A baseline entry `a|b` means exactly one of its members is observed on any
// given run, for server behaviour that races (a reset against a 505).
export function compare(observed: Violation[], expected: Set<string>): Verdict {
  const observedIds = new Set(observed.map(x => x.id));
  const groups = [...expected].map(entry => entry.split('|'));
  const listed = (id: string) => groups.some(group => group.includes(id));
  return {
    known: observed.filter(x => listed(x.id)),
    regressions: observed.filter(x => !listed(x.id)),
    resolved: [...expected].filter(entry => entry.split('|').filter(m => observedIds.has(m)).length !== 1)
  };
}

// `run` returns the violations it observed; anything it throws is a
// transport or harness failure and fails the test regardless of the baseline.
export function conformanceTest(
  harness: Harness,
  id: string,
  skip: Skip | undefined,
  run: () => Promise<Violation[]>
) {
  // A declared skip runs far enough to record its category and reason, so
  // the results file can tell it from a case a --testNamePattern filter left
  // out.
  if (skip) {
    it(id, ctx => ctx.skip(skipNote(skip)));
    return;
  }
  const expected = harness.expected.get(id) ?? new Set<string>();
  it(id, async ({ annotate }) => {
    const { known, regressions, resolved } = compare(await run(), expected);

    if (known.length) {
      await annotate(areasFor(harness.known, id).join('; '), annotationTypes.known);
      await annotate(known.map(describe).join('\n'), annotationTypes.observed);
    }
    const problems: string[] = [];
    if (regressions.length) {
      await annotate(regressions.map(describe).join('\n'), annotationTypes.regression);
      problems.push(`unexpected violations:\n${regressions.map(x => `  ${describe(x)}`).join('\n')}`);
    }
    if (resolved.length) {
      await annotate(resolved.join(', '), annotationTypes.resolved);
      problems.push(
        `no longer observed: ${resolved.join(', ')}. Remove them from ` +
        `conformance/known-failures/${harness.config.name}.yaml for ${id} and run ` +
        '`pnpm -F @uwdata/mosaic-conformance status`.'
      );
    }
    if (problems.length) throw new Error(problems.join('\n'));
  });
}

// Annotations are split on newlines when the results file is written, so a
// multi-line engine message must not smuggle its lines in as ids.
export function describe(violation: Violation) {
  return `${violation.id}: ${violation.detail.replace(/\s*\n\s*/g, ' ')}`;
}
