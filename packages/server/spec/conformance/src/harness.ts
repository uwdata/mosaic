import { inject, it } from 'vitest';
import { serverConfig, type ServerConfig } from '../servers/index.ts';
import { loadCases } from './cases.ts';
import { connectorCaseIds } from './connector-cases.ts';
import { knownFailureIndex, loadKnownFailures, type KnownFailure } from './known.ts';
import type { Capability } from './types.ts';

export const annotationTypes = {
  known: 'known-failure',
  actual: 'actual',
  unexpectedPass: 'unexpected-pass'
} as const;

export interface Harness {
  config: ServerConfig;
  url: () => string;
  wsUrl: () => string;
  known: Map<string, KnownFailure>;
}

export function allCaseIds(): Set<string> {
  return new Set([...loadCases().map(c => c.id), ...connectorCaseIds]);
}

export function createHarness(): Harness {
  const config = serverConfig(process.env.CONFORMANCE_SERVER);
  const known = knownFailureIndex(loadKnownFailures(config.name, allCaseIds()));
  const url = () => inject('conformanceUrl');
  return { config, url, wsUrl: () => url().replace(/^http/, 'ws'), known };
}

export function skipReason(config: ServerConfig, requires: Capability[] = [], unless: Capability[] = []) {
  const missing = requires.filter(cap => !config.capabilities.has(cap));
  const present = unless.filter(cap => config.capabilities.has(cap));
  if (missing.length) return `requires ${missing.join(', ')}`;
  if (present.length) return `only when ${present.join(', ')} is unavailable`;
  return undefined;
}

export function conformanceTest(
  harness: Harness,
  id: string,
  skip: string | undefined,
  run: () => Promise<void>
) {
  if (skip) {
    it.skip(id);
    return;
  }
  const known = harness.known.get(id);
  it(id, async ({ annotate }) => {
    let error: Error | undefined;
    try {
      await run();
    } catch (err) {
      error = err as Error;
    }
    if (known) {
      if (error) {
        await annotate(known.area, annotationTypes.known);
        await annotate(error.message, annotationTypes.actual);
        return;
      }
      await annotate(known.area, annotationTypes.unexpectedPass);
      throw new Error(
        `${id} now passes. Remove it from conformance/known-failures/${harness.config.name}.yaml ` +
        `under "${known.area}" and run \`pnpm -F @uwdata/mosaic-server-spec conformance:docs\`.`
      );
    }
    if (error) throw error;
  });
}
