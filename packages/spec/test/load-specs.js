import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

const BASE = join(__dirname, '../../../specs');
const YAML_DIR = join(BASE, 'yaml');
const JSON_DIR = join(BASE, 'json');
const ESM_DIR = join(BASE, 'esm');

const EXT = '.yaml';
const names = (await readdir(YAML_DIR))
  .filter(f => f.endsWith(EXT))
  .map(f => f.slice(0, -EXT.length));

export const specs = new Map(await Promise.all(
  names.map(async name => [name, await loadSpec(name)])
));

export async function loadSpec(name) {
  return parse(await readFile(join(YAML_DIR, `${name}.yaml`), 'utf8'));
}

export function loadJSON(name) {
  return readFile(join(JSON_DIR, `${name}.json`), 'utf8');
}

export function loadESM(name) {
  return readFile(join(ESM_DIR, `${name}.js`), 'utf8');
}

export async function loadJSONSchema() {
  const path = join(__dirname, '../dist/mosaic-schema.json');
  const text = await readFile(path, 'utf8');
  return JSON.parse(text);
}
