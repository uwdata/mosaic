import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { conformanceRoot } from './cases.ts';

// A known failure names, per case, the violation ids the server produces
// today. The runner is green only when each case's observed violations equal
// the union of its listed ids across all areas.
export interface KnownFailure {
  area: string;
  current: string;
  spec: string;
  fix: string;
  ref?: string;
  cases: Record<string, string[]>;
}

export interface KnownFailuresFile {
  server: string;
  inherits?: string;
  notes?: string;
  passes?: string[];
  failures: KnownFailure[];
}

export interface KnownFailures {
  server: string;
  inherits?: string;
  own: KnownFailure[];
  inherited: KnownFailure[];
}

export const knownFailuresDir = path.join(conformanceRoot, 'known-failures');

const violationId = /^[a-z0-9_-]+(\.[a-z0-9_-]+)*(\|[a-z0-9_-]+(\.[a-z0-9_-]+)*)*$/;

export function knownFailuresPath(server: string) {
  return path.join(knownFailuresDir, `${server}.yaml`);
}

export function readKnownFailuresFile(server: string): KnownFailuresFile {
  const file = knownFailuresPath(server);
  if (!existsSync(file)) return { server, passes: [], failures: [] };
  const parsed = parse(readFileSync(file, 'utf8')) as KnownFailuresFile;
  if (parsed.server !== server) throw new Error(`${file}: server must be ${server}`);
  for (const failure of parsed.failures ?? []) {
    for (const field of ['area', 'current', 'spec', 'fix'] as const) {
      if (!failure[field]) throw new Error(`${file}: entry "${failure.area ?? '?'}" is missing ${field}`);
    }
    if (failure.cases === null || failure.cases === undefined) failure.cases = {};
    if (typeof failure.cases !== 'object' || Array.isArray(failure.cases)) {
      throw new Error(`${file}: "${failure.area}" needs a cases map of case id to violation ids (may be empty)`);
    }
    for (const [id, violations] of Object.entries(failure.cases)) {
      if (!Array.isArray(violations) || violations.length === 0) {
        throw new Error(`${file}: "${failure.area}" case ${id} needs a non-empty list of violation ids`);
      }
      for (const violation of violations) {
        if (typeof violation !== 'string' || !violationId.test(violation)) {
          throw new Error(`${file}: "${failure.area}" case ${id} has an invalid violation id ${JSON.stringify(violation)}`);
        }
      }
    }
  }
  return { ...parsed, failures: parsed.failures ?? [], passes: parsed.passes ?? [] };
}

export function loadKnownFailures(server: string, caseIds: Set<string>): KnownFailures {
  const own = readKnownFailuresFile(server);
  const file = knownFailuresPath(server);
  const seen = new Map<string, string>();
  for (const failure of own.failures) {
    for (const [id, violations] of Object.entries(failure.cases)) {
      if (!caseIds.has(id)) throw new Error(`${file}: "${failure.area}" references unknown case ${id}`);
      for (const violation of violations) {
        const key = `${id} ${violation}`;
        const other = seen.get(key);
        if (other) throw new Error(`${file}: ${id} lists ${violation} under both "${other}" and "${failure.area}"`);
        seen.set(key, failure.area);
      }
    }
  }
  const ownCases = new Set([...seen.keys()].map(k => k.split(' ')[0]));

  const passes = own.passes ?? [];
  let inherited: KnownFailure[] = [];
  if (own.inherits) {
    if (own.inherits === server) throw new Error(`${file}: a file cannot inherit from itself`);
    const base = loadKnownFailures(own.inherits, caseIds);
    const baseIndex = expectedViolations(base);
    for (const id of passes) {
      if (!caseIds.has(id)) throw new Error(`${file}: passes references unknown case ${id}`);
      if (!baseIndex.has(id)) throw new Error(`${file}: passes lists ${id}, which ${own.inherits} does not mark as failing`);
      if (ownCases.has(id)) throw new Error(`${file}: ${id} cannot be both in passes and in failures`);
    }
    const overridden = new Set([...ownCases, ...passes]);
    inherited = [...base.inherited, ...base.own]
      .map(failure => ({
        ...failure,
        cases: Object.fromEntries(Object.entries(failure.cases).filter(([id]) => !overridden.has(id)))
      }))
      .filter(failure => Object.keys(failure.cases).length > 0);
  } else if (passes.length) {
    throw new Error(`${file}: passes only makes sense together with inherits`);
  }

  return { server, inherits: own.inherits, own: own.failures, inherited };
}

export function expectedViolations(known: KnownFailures): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const failure of [...known.inherited, ...known.own]) {
    for (const [id, violations] of Object.entries(failure.cases)) {
      const set = index.get(id) ?? new Set<string>();
      for (const violation of violations) set.add(violation);
      index.set(id, set);
    }
  }
  return index;
}

export function areasFor(known: KnownFailures, caseId: string): string[] {
  const areas: string[] = [];
  for (const failure of [...known.inherited, ...known.own]) {
    if (caseId in failure.cases) areas.push(failure.area);
  }
  return areas;
}
