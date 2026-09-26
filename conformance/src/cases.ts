import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { commandTransports, layerOf, wireTransports, type CaseDefinition, type ConformanceCase, type Expectation, type Layer, type Step, type Transport, type WireTransport } from './types.ts';

export const conformanceRoot = path.resolve(import.meta.dirname, '..');
export const repoRoot = path.resolve(conformanceRoot, '..');

const casesDir = path.join(conformanceRoot, 'cases');
const defaultTransports: WireTransport[] = ['post', 'ws'];
const validTransports = new Set<string>(wireTransports);
const validCorrelation = new Set<string>(['auto', 'manual']);
const validLayers = new Set<string>(['wire', 'command']);

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
    if (!validTransports.has(t)) throw new Error(`${where}: unknown transport ${t}; a case lists wire transports only`);
  }
  for (const l of def.layers ?? []) {
    if (!validLayers.has(l)) throw new Error(`${where}: unknown layer ${l}`);
  }
  if (def.smoke && !layersOf(def).includes('command')) throw new Error(`${where}: a smoke case must apply to the command layer`);
  for (const c of [def.correlation, ...(def.steps ?? []).map(s => s.correlation)]) {
    if (c !== undefined && !validCorrelation.has(c)) throw new Error(`${where}: correlation must be auto or manual`);
  }
  if ((def.correlation === 'manual' || def.steps?.some(s => s.correlation === 'manual')) && !(def.transports ?? []).every(t => t === 'comm')) {
    throw new Error(`${where}: manual correlation only applies to comm`);
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

// Which layers a case belongs to. Explicit `layers:` wins; otherwise a case
// is command-level when nothing in it is about encoding: every step is a
// `request` (no raw bodies, no headers) and every expectation is a result,
// an acknowledgement, a JSON object, or an error identified by code (no
// status, headers, or body emptiness). A case restricted to GET alone is
// wire-only because GET's command set and read-only rule have no in-process
// counterpart. Anything else is checked at both layers.
export function layersOf(def: CaseDefinition): Layer[] {
  if (def.layers) return def.layers;
  const wireOnly = def.transports?.length === 1 && def.transports[0] === 'get';
  const steps = def.steps ?? [{ request: def.request, raw: def.raw, headers: def.headers, expect: def.expect! }];
  const encodingFree = !wireOnly && steps.every(step =>
    step.raw === undefined && step.headers === undefined && commandLevel(step.expect)
    && Object.values(step.capture ?? {}).every(source => !source.startsWith('headers.'))
  );
  return encodingFree ? ['wire', 'command'] : ['wire'];
}

function commandLevel(expectation: Expectation): boolean {
  if (expectation.oneOf) return expectation.oneOf.every(commandLevel);
  if (expectation.status !== undefined || expectation.headers || expectation.empty) return false;
  if (expectation.error?.status !== undefined) return false;
  return true;
}

export interface Transports {
  transports: Transport[];
  smoke?: Transport[];
}

// Expands definitions over a target's transports: wire transports the case
// lists (default POST and WebSocket), command transports the target runs the
// whole corpus on, and smoke transports the target runs only `smoke: true`
// cases on. The comm wire carries whole commands but no HTTP or frame
// details, so every command-level case reaches it as well as the cases that
// name it. A case that reaches a transport of the wrong layer is expanded
// anyway and skipped as `layer` at run time, so the results record it.
export function expandCases(definitions: CaseDefinition[], target: Transports): ConformanceCase[] {
  const cases: ConformanceCase[] = [];
  const full = new Set(target.transports);
  const smoke = new Set(target.smoke ?? []);
  for (const definition of definitions) {
    const steps: Step[] = definition.steps ?? [{
      request: definition.request,
      raw: definition.raw,
      headers: definition.headers,
      expect: definition.expect!
    }];
    const layers = layersOf(definition);
    const listed = definition.transports ?? defaultTransports;
    const wire = new Set<Transport>(listed.filter(t => full.has(t)));
    if (full.has('comm') && !listed.includes('comm') && layers.includes('command')) wire.add('comm');
    const transports: Transport[] = [
      ...wire,
      ...commandTransports.filter(t => full.has(t) || (smoke.has(t) && definition.smoke))
    ];
    for (const transport of transports) {
      const explicit = listed.includes(transport as WireTransport);
      cases.push({
        id: `${transport}/${definition.id}`,
        transport,
        layer: layerOf(transport),
        applicable: transport === 'comm' ? explicit || layers.includes('command') : layers.includes(layerOf(transport)),
        definition,
        steps,
        pipeline: definition.pipeline === true
      });
    }
  }
  return cases;
}

export const allTransports: Transports = { transports: [...wireTransports, ...commandTransports] };

export function loadCases(target: Transports = allTransports): ConformanceCase[] {
  return expandCases(loadCaseDefinitions(), target);
}

const padToken = /\$PAD\((\d+)\)/;
const dataToken = /\$DATA\//g;
const varToken = /\{\{(\w+)\}\}/g;

export function encodeCommand(request: Record<string, unknown>, transport: Transport): string {
  if (transport !== 'get') return JSON.stringify(request);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(request)) {
    params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  return params.toString();
}

// Resolves `{{var}}`, `$DATA/`, and `$PAD(n)`. The pad brings the *encoded*
// payload (JSON body or query string) to exactly n bytes, so a size floor is
// measured on what the server actually receives.
export function expandRequest(
  request: Record<string, unknown>,
  vars: Record<string, string>,
  transport: Transport
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(request)) {
    out[key] = typeof value === 'string' ? substitute(value.replace(dataToken, `${path.join(repoRoot, 'data')}/`), vars) : value;
  }
  for (const [key, value] of Object.entries(out)) {
    if (typeof value !== 'string') continue;
    const match = padToken.exec(value);
    if (!match) continue;
    const target = Number(match[1]);
    const base = encodeCommand({ ...out, [key]: value.replace(padToken, '') }, transport).length;
    out[key] = value.replace(padToken, 'x'.repeat(Math.max(0, target - base)));
  }
  return out;
}

export function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(varToken, (_, name) => {
    if (!(name in vars)) throw new Error(`no captured value named ${name}`);
    return vars[name];
  });
}

export function unresolvedVars(step: Step, vars: Record<string, string>): string[] {
  const names = new Set<string>();
  const scan = (text: unknown) => {
    if (typeof text !== 'string') return;
    for (const m of text.matchAll(varToken)) if (!(m[1] in vars)) names.add(m[1]);
  };
  for (const value of Object.values(step.request ?? {})) scan(value);
  for (const value of Object.values(step.headers ?? {})) scan(value);
  scan(step.raw?.body);
  scan(step.raw?.query);
  return [...names];
}
