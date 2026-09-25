import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { conformanceRoot } from './cases.ts';

export interface KnownFailure {
  cases: string[];
  area: string;
  current: string;
  spec: string;
  fix: string;
  ref?: string;
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
    if (!Array.isArray(failure.cases)) throw new Error(`${file}: "${failure.area}" needs a cases list (may be empty)`);
  }
  return { ...parsed, failures: parsed.failures ?? [], passes: parsed.passes ?? [] };
}

export function loadKnownFailures(server: string, caseIds: Set<string>): KnownFailures {
  const own = readKnownFailuresFile(server);
  const file = knownFailuresPath(server);
  const ownCases = new Set<string>();
  for (const failure of own.failures) {
    for (const id of failure.cases) {
      if (!caseIds.has(id)) throw new Error(`${file}: "${failure.area}" references unknown case ${id}`);
      if (ownCases.has(id)) throw new Error(`${file}: case ${id} is listed twice`);
      ownCases.add(id);
    }
  }

  const passes = own.passes ?? [];
  let inherited: KnownFailure[] = [];
  if (own.inherits) {
    if (own.inherits === server) throw new Error(`${file}: a file cannot inherit from itself`);
    const base = loadKnownFailures(own.inherits, caseIds);
    const overridden = new Set([...ownCases, ...passes]);
    for (const id of passes) {
      if (!caseIds.has(id)) throw new Error(`${file}: passes references unknown case ${id}`);
      if (!knownFailureIndex(base).has(id)) {
        throw new Error(`${file}: passes lists ${id}, which ${own.inherits} does not mark as failing`);
      }
    }
    inherited = [...base.inherited, ...base.own]
      .map(failure => ({ ...failure, cases: failure.cases.filter(id => !overridden.has(id)) }))
      .filter(failure => failure.cases.length > 0);
  } else if (passes.length) {
    throw new Error(`${file}: passes only makes sense together with inherits`);
  }

  return { server, inherits: own.inherits, own: own.failures, inherited };
}

export function knownFailureIndex(known: KnownFailures): Map<string, KnownFailure> {
  const index = new Map<string, KnownFailure>();
  for (const failure of [...known.inherited, ...known.own]) {
    for (const id of failure.cases) index.set(id, failure);
  }
  return index;
}
