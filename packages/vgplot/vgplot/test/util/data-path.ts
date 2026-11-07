import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../../../../data/');

export function dataPath(file: string): string {
  return resolve(root, file);
}
