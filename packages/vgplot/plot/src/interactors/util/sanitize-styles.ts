import { toKebabCase } from './to-kebab-case.js';

export function sanitizeStyles(styles) {
  const s = {};
  for (const name in styles) {
    s[toKebabCase(name)] = styles[name];
  }
  return s;
}
