// Shared Python code-generation helpers, used by both the spec generator
// (ast-to-python.js, which turns a Mosaic spec into example Python code) and
// the API generator (bin/generate-python-api.js, which turns the JSON schema
// into the vgplot Python API). Keeping them here guarantees the two generators
// agree on naming, keyword safety, literal emission, and API conventions.
import { camelCaseToSnake } from './util.js';

export const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'type', 'while', 'with', 'yield',
]);

// Keywords that cannot appear as a bare keyword-argument name. `type` is a
// builtin, not a reserved word, so it stays valid as a kwarg.
const PYTHON_KWARG_UNSAFE = new Set(
  [...PYTHON_KEYWORDS].filter(k => k !== 'type')
);

/** Format `name=value`, falling back to **{'name': value} for keyword names. */
export function kwarg(name, valueStr) {
  return PYTHON_KWARG_UNSAFE.has(name)
    ? `**{${JSON.stringify(name)}: ${valueStr}}`
    : `${name}=${valueStr}`;
}

// Python-API naming conventions that are absent from the JSON schema: the
// interactor/legend option keys are renamed for the Python surface.
export const INTERACTOR_KEY_MAP = { as: 'bind', pixelSize: 'pixel_size' };
export const LEGEND_KEY_MAP = { as: 'bind', for: 'plot' };

/** Python argument name for an input option key. */
export function inputArgName(key) {
  if (key === 'as') return 'bind';
  if (key === 'from') return 'source';
  return camelCaseToSnake(key);
}

/**
 * Emit a Python literal for a JSON value. When `ctx` is provided, `$name`
 * strings resolve to the corresponding Python identifier; otherwise they are
 * emitted verbatim (the API generator passes no ctx and only emits constants).
 */
export function literal(v, depth = 0, ctx = null) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return "float('nan')";
    if (v === Infinity) return "float('inf')";
    if (v === -Infinity) return "float('-inf')";
    return String(v);
  }
  if (typeof v === 'string') {
    if (ctx && /^\$[A-Za-z_][A-Za-z0-9_]*$/.test(v)) {
      return ctx.ident(v.slice(1));
    }
    // Prefer single quotes when the string contains double quotes (avoids escape sequences)
    if (v.includes('"') && !v.includes("'")) return `'${v}'`;
    return JSON.stringify(v);
  }
  const pad = '    '.repeat(depth + 1);
  const closePad = '    '.repeat(depth);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    // Treat all strings as primitive (including $param refs which resolve to short idents)
    const isPrimitive = x => x === null || typeof x === 'boolean' || typeof x === 'number' ||
      typeof x === 'string';
    if (v.length <= 6 && v.every(isPrimitive)) {
      return '[' + v.map(x => literal(x, 0, ctx)).join(', ') + ']';
    }
    const items = v.map(x => pad + literal(x, depth + 1, ctx)).join(',\n');
    return '[\n' + items + ',\n' + closePad + ']';
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v)
      .filter(([, val]) => val !== undefined)
      .map(([k, val]) => `${pad}${JSON.stringify(k)}: ${literal(val, depth + 1, ctx)}`);
    if (!entries.length) return '{}';
    return '{\n' + entries.join(',\n') + '\n' + closePad + '}';
  }
  return 'None';
}

/** Indent every line of `str` by `depth` levels of four spaces. */
export function indentLine(str, depth) {
  const pad = '    '.repeat(depth);
  return str.split('\n').map(line => pad + line).join('\n');
}
