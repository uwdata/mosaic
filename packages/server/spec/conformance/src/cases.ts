import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import type { CaseDefinition, ConformanceCase, Step, Transport } from './types.ts';

export const conformanceRoot = path.resolve(import.meta.dirname, '..');
export const repoRoot = path.resolve(conformanceRoot, '../../../..');

const casesDir = path.join(conformanceRoot, 'cases');
const defaultTransports: Transport[] = ['post', 'ws'];
const validTransports = new Set<Transport>(['post', 'get', 'ws']);

export function loadCaseDefinitions(): CaseDefinition[] {
  const files = readdirSync(casesDir).filter(f => f.endsWith('.yaml')).sort();
  const definitions: CaseDefinition[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const parsed = parse(readFileSync(path.join(casesDir, file), 'utf8'));
    if (!Array.isArray(parsed)) throw new Error(`${file}: expected a list of cases`);
    for (const def of parsed as CaseDefinition[]) {
      validateDefinition(def, file);
      if (seen.has(def.id)) throw new Error(`${file}: duplicate case id ${def.id}`);
      seen.add(def.id);
      definitions.push(def);
    }
  }
  return definitions;
}

function validateDefinition(def: CaseDefinition, file: string) {
  const where = `${file}: case ${def.id ?? '<no id>'}`;
  if (!def.id || !/^[a-z0-9-]+$/.test(def.id)) throw new Error(`${where}: id must be kebab-case`);
  if (!def.title) throw new Error(`${where}: title is required`);
  if (!Array.isArray(def.decisions) || def.decisions.length === 0) {
    throw new Error(`${where}: decisions must list at least one decision id`);
  }
  for (const t of def.transports ?? []) {
    if (!validTransports.has(t)) throw new Error(`${where}: unknown transport ${t}`);
  }
  const hasInline = def.request !== undefined || def.raw !== undefined;
  if (hasInline === (def.steps !== undefined)) {
    throw new Error(`${where}: provide either request/raw + expect or steps`);
  }
  if (hasInline && !def.expect) throw new Error(`${where}: expect is required`);
  for (const step of def.steps ?? []) {
    if (!step.expect) throw new Error(`${where}: every step needs expect`);
    if (step.request === undefined && step.raw === undefined) {
      throw new Error(`${where}: every step needs request or raw`);
    }
  }
}

export function expandCases(definitions: CaseDefinition[]): ConformanceCase[] {
  const cases: ConformanceCase[] = [];
  for (const definition of definitions) {
    const steps: Step[] = definition.steps ?? [{
      request: definition.request,
      raw: definition.raw,
      headers: definition.headers,
      expect: definition.expect!
    }];
    for (const transport of definition.transports ?? defaultTransports) {
      cases.push({
        id: `${transport}/${definition.id}`,
        transport,
        definition,
        steps,
        pipeline: definition.pipeline === true
      });
    }
  }
  return cases;
}

export function loadCases(): ConformanceCase[] {
  return expandCases(loadCaseDefinitions());
}

const padToken = /\$PAD\((\d+)\)/;
const dataToken = /\$DATA\//g;

export function expandSql(sql: string): string {
  const padded = sql.replace(padToken, (token, bytes) => {
    const target = Number(bytes) - (sql.length - token.length);
    return 'x'.repeat(Math.max(0, target));
  });
  return padded.replace(dataToken, `${path.join(repoRoot, 'data')}/`);
}

export function expandRequest(request: Record<string, unknown>, vars: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(request)) {
    out[key] = typeof value === 'string' ? substitute(expandSql(value), vars) : value;
  }
  return out;
}

export function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    if (!(name in vars)) throw new Error(`no captured value named ${name}`);
    return vars[name];
  });
}
