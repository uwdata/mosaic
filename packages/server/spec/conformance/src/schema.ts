import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';
import { conformanceRoot } from './cases.ts';

const schemasPath = path.join(conformanceRoot, '..', 'schemas.yaml');

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

export function schemaErrors(definition: string, value: unknown): string[] {
  const fn = validator(definition);
  if (fn(value)) return [];
  return (fn.errors ?? []).map(e => `${e.instancePath || '/'} ${e.message ?? ''}`.trim());
}
