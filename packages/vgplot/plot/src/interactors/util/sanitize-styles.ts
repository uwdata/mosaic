import { toKebabCase } from './to-kebab-case.js';

export function sanitizeStyles(styles: Record<string, string | number>): Record<string, string | number> {
  const s: Record<string, string | number> = {};
  for (const name in styles) {
    s[toKebabCase(name)] = styles[name];
  }
  return s;
}
