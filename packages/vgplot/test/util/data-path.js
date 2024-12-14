import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../../../data/');

export function dataPath(file) {
  return resolve(root, file);
}
