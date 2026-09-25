import { inject, it } from 'vitest';
import { serverConfig, type ServerConfig } from '../servers/index.ts';
import { loadCases } from './cases.ts';
import { connectorCaseIds } from './connector-cases.ts';
import { areasFor, expectedViolations, loadKnownFailures, type KnownFailures } from './known.ts';
import type { Capability, Violation } from './types.ts';

export const annotationTypes = {
  known: 'known-failure',
  observed: 'observed',
  regression: 'regression',
  resolved: 'resolved'
} as const;

export interface Harness {
  config: ServerConfig;
  url: () => string;
  wsUrl: () => string;
  known: KnownFailures;
  expected: Map<string, Set<string>>;
}

export function allCaseIds(): Set<string> {
  return new Set([...loadCases().map(c => c.id), ...connectorCaseIds]);
}

export function createHarness(): Harness {
  const config = serverConfig(process.env.CONFORMANCE_SERVER);
  const known = loadKnownFailures(config.name, allCaseIds());
  const url = () => inject('conformanceUrl');
  return { config, url, wsUrl: () => url().replace(/^http/, 'ws'), known, expected: expectedViolations(known) };
}

export function skipReason(config: ServerConfig, requires: Capability[] = [], unless: Capability[] = []) {
  const missing = requires.filter(cap => !config.capabilities.has(cap));
  const present = unless.filter(cap => config.capabilities.has(cap));
  if (missing.length) return `requires ${missing.join(', ')}`;
  if (present.length) return `only when ${present.join(', ')} is unavailable`;
  return undefined;
}

// `run` returns the violations it observed; anything it throws is a
// transport or harness failure and fails the test regardless of the baseline.
export function conformanceTest(
  harness: Harness,
  id: string,
  skip: string | undefined,
  run: () => Promise<Violation[]>
) {
  if (skip) {
    it.skip(id);
    return;
  }
  const expected = harness.expected.get(id) ?? new Set<string>();
  it(id, async ({ annotate }) => {
    const observed = await run();
    const observedIds = new Set(observed.map(x => x.id));
    const regressions = observed.filter(x => !expected.has(x.id));
    const resolved = [...expected].filter(x => !observedIds.has(x));
    const known = observed.filter(x => expected.has(x.id));

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
        '`pnpm -F @uwdata/mosaic-server-spec conformance:docs`.'
      );
    }
    if (problems.length) throw new Error(problems.join('\n'));
  });
}

export function describe(violation: Violation) {
  return `${violation.id}: ${violation.detail}`;
}
