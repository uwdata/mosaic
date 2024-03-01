import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '../../../specs');
const YAML = join(BASE, 'yaml');
const JSON = join(BASE, 'json');
const ESM = join(BASE, 'esm');

const EXT = '.yaml';
const names = (await readdir(YAML))
  .filter(f => f.endsWith(EXT))
  .map(f => f.slice(0, -EXT.length));

export const specs = new Map(await Promise.all(
  names.map(async name => [name, await loadSpec(name)])
));

export async function loadSpec(name) {
  return parse(await readFile(join(YAML, `${name}.yaml`), 'utf8'));
}

export function loadJSON(name) {
  return readFile(join(JSON, `${name}.json`), 'utf8');
}

export function loadESM(name) {
  return readFile(join(ESM, `${name}.js`), 'utf8');
}
