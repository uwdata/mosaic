import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

const BASE = '../../specs';
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

export function writeJSON(name, data) {
  return writeFile(join(JSON, `${name}.json`), data);
}

export function loadESM(name) {
  return readFile(join(ESM, `${name}.js`), 'utf8');
}

export function writeESM(name, data) {
  return writeFile(join(ESM, `${name}.js`), data);
}
