import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';
import { conformanceRoot } from './cases.ts';

const schemasPath = path.join(conformanceRoot, 'schemas.yaml');

let ajv: Ajv2020 | undefined;
let schemaId: string;

function instance() {
  if (!ajv) {
    const schema = parse(readFileSync(schemasPath, 'utf8'));
    schemaId = schema.$id;
    ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats.default(ajv);
    ajv.addSchema(schema);
  }
  return ajv;
}

export function validator(definition: string): ValidateFunction {
  const fn = instance().getSchema(`${schemaId}#/$defs/${definition}`);
  if (!fn) throw new Error(`schemas.yaml has no definition ${definition}`);
  return fn;
}

export interface SchemaViolation {
  id: string;
  detail: string;
}

// Keywords that only report that a nested branch failed; the branch's own
// errors carry the information.
const wrappers = new Set(['if', 'then', 'else', 'oneOf', 'anyOf', 'allOf', 'not']);

// One violation per concrete schema failure, identified by keyword and the
// property it concerns (`required.code`, `forbidden.catalog`, `enum.code`),
// so a baseline names which rules a server breaks rather than "the schema".
export function schemaViolations(prefix: string, definition: string, value: unknown): SchemaViolation[] {
  const fn = validator(definition);
  if (fn(value)) return [];
  const seen = new Set<string>();
  const out: SchemaViolation[] = [];
  for (const error of fn.errors ?? []) {
    if (wrappers.has(error.keyword)) continue;
    const at = error.instancePath.split('/').filter(Boolean);
    const params = error.params as Record<string, unknown>;
    let id: string;
    if (error.keyword === 'required') id = `required.${[...at, params.missingProperty].join('.')}`;
    else if (error.keyword === 'additionalProperties') id = `additional.${[...at, params.additionalProperty].join('.')}`;
    else if (error.keyword === 'false schema') id = `forbidden.${at.join('.')}`;
    else id = [error.keyword.toLowerCase().replace(/\s+/g, '-'), ...at].join('.');
    const full = `${prefix}.${id}`;
    if (seen.has(full)) continue;
    seen.add(full);
    out.push({ id: full, detail: `${error.instancePath || '/'} ${error.message ?? error.keyword}`.trim() });
  }
  return out;
}
