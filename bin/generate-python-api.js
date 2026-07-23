// Generate the mechanical part of the vgplot Python API (marks, plot
// attributes, and encoding transforms) from the Mosaic JSON schema, the source
// of truth produced by the JS build (`pnpm run schema`). Interactors, inputs,
// legends, data sources, params, and the runtime core stay hand-written.
//
// Run: node bin/generate-python-api.js   (or: pnpm run generate:python-api)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { camelCaseToSnake } from '../packages/vgplot/spec/src/util.js';
import { PYTHON_KEYWORDS } from '../packages/vgplot/spec/src/python-codegen.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCHEMA = resolve(ROOT, 'packages/vgplot/spec/dist/mosaic-schema.json');
const OUT_DIR = resolve(ROOT, 'packages/vgplot/vgplot-python/vgplot/_generated');
const SPEC_GEN_DIR = resolve(ROOT, 'packages/vgplot/spec/src/generated');

// Attributes handled by special hand-written helpers (not simple value directives).
const EXCLUDE_ATTRS = new Set(['margins']);

const HEADER =
  '# DO NOT EDIT. Generated from the Mosaic JSON schema by bin/generate-python-api.js.\n' +
  '# Regenerate with: pnpm run generate:python-api\n';

/** Python identifier for a schema (camelCase) name, keyword-safe. */
function ident(name) {
  const s = camelCaseToSnake(name);
  return PYTHON_KEYWORDS.has(s) ? s + '_' : s;
}

/** First sentence of a schema description, with markdown links stripped and
 * escaped for a docstring. */
function docline(desc, fallback) {
  let text = (desc || fallback || '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')   // [text](url) -> text
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')  // [text][ref] -> text
    .replace(/\[(\d+)\]/g, '')                 // bare footnote [1] -> (removed)
    .replace(/\[([^\]]+)\]/g, '$1')            // [text] shortcut -> text
    .replace(/\s+/g, ' ').trim();
  const first = text.split(/(?<=\.)\s/)[0] || fallback;
  return first.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
}

/** True if the attribute schema admits a boolean (so it gets a `= True` default). */
function isBooleanAttr(def) {
  const opts = def.anyOf || def.oneOf || [def];
  return opts.some(o => o.type === 'boolean');
}

/** Extract a mark's const name and unioned channel properties from a def,
 * handling both flat defs and `anyOf`/`allOf` intersection defs (e.g. densityX). */
function markInfo(def) {
  if (def.properties?.mark?.const) {
    return { mark: def.properties.mark.const, props: def.properties, description: def.description };
  }
  // Union the branches of an intersection def (e.g. densityX). Only a single-mark
  // def qualifies; skip union defs like `Spec` whose branches span many marks.
  const branches = def.anyOf || def.allOf || [];
  const consts = new Set();
  const props = {};
  for (const b of branches) {
    const c = b.properties?.mark?.const;
    if (c) { consts.add(c); Object.assign(props, b.properties); }
  }
  if (consts.size !== 1) return null;
  return { mark: [...consts][0], props, description: def.description };
}

function generateMarks(defs) {
  const marks = [];
  for (const d of Object.values(defs)) {
    const info = markInfo(d);
    if (info) marks.push(info);
  }
  marks.sort((a, b) => a.mark.localeCompare(b.mark));

  const out = [HEADER, 'from typing import Any', '', 'from .._types import UNSET, ChannelValue, MarkData',
    'from ..plot import Mark', '', '',
    'def _mark(name: str, args: dict[str, Any]) -> Mark:',
    '    args = dict(args)',
    '    data = args.pop("data")',
    '    options = args.pop("options")',
    '    enc = {k: v for k, v in args.items() if v is not UNSET}',
    '    enc.update(options)',
    '    return Mark(name, data=data, enc=enc or None)',
    '', ''];
  const names = [];
  for (const { mark, props: propsObj, description } of marks) {
    const fn = ident(mark);
    names.push(fn);
    // Channel/option properties: everything except the `mark` const, `data`,
    // and any non-identifier keys (e.g. a stray `$schema`).
    const props = Object.keys(propsObj)
      .filter(p => p !== 'mark' && p !== 'data' && /^[A-Za-z][A-Za-z0-9]*$/.test(p));
    const params = props.map(p => `    ${ident(p)}: ChannelValue | UNSET = UNSET,`);
    const doc = docline(description, `The ${mark} mark.`);
    out.push(
      `def ${fn}(`,
      '    data: MarkData = None,',
      '    *,',
      ...params,
      '    **options: Any,',
      ') -> Mark:',
      `    """${doc}"""`,
      `    return _mark(${JSON.stringify(mark)}, locals())`,
      '', '',
    );
  }
  out.push(`__all__ = [\n${names.map(n => `    ${JSON.stringify(n)},`).join('\n')}\n]`, '');
  writeFileSync(resolve(OUT_DIR, 'marks.py'), out.join('\n').replace(/\n{3,}/g, '\n\n\n'));
  return names;
}

function generateAttributes(defs) {
  const pa = defs.PlotAttributes;
  if (!pa) throw new Error('PlotAttributes not found in schema');
  const attrs = Object.keys(pa.properties)
    .filter(a => !EXCLUDE_ATTRS.has(a))
    .sort((a, b) => a.localeCompare(b));

  const out = [HEADER, 'from .._types import AttrValue', 'from ..plot import Directive', '', ''];
  const names = [];
  for (const attr of attrs) {
    const fn = ident(attr);
    names.push(fn);
    const def = pa.properties[attr];
    const boolean = isBooleanAttr(def);
    const sig = boolean
      ? `def ${fn}(value: AttrValue = True) -> Directive:`
      : `def ${fn}(value: AttrValue) -> Directive:`;
    out.push(
      sig,
      `    """${docline(def.description, `The ${attr} attribute.`)}"""`,
      `    return Directive(${JSON.stringify(attr)}, value)`,
      '', '',
    );
  }
  out.push(`__all__ = [\n${names.map(n => `    ${JSON.stringify(n)},`).join('\n')}\n]`, '');
  writeFileSync(resolve(OUT_DIR, 'attributes.py'), out.join('\n').replace(/\n{3,}/g, '\n\n\n'));
  return names;
}

// Python parameter names for transforms that take more than a single column.
const TRANSFORM_ARGS = {
  argmax: ['col', 'by'],
  argmin: ['col', 'by'],
  quantile: ['col', 'p'],
  lag: ['col', 'offset', 'default'],
  lead: ['col', 'offset', 'default'],
  nth_value: ['col', 'offset'],
  ntile: ['buckets'],
};

/** Positional-argument range [min, max] admitted by a transform key schema. */
function argRange(sch) {
  if (sch.type === 'array') return [sch.minItems ?? 0, sch.maxItems ?? sch.minItems ?? 0];
  if (sch.type === 'null') return [0, 0];
  if (sch.anyOf) {
    const rs = sch.anyOf.map(argRange);
    return [Math.min(...rs.map(r => r[0])), Math.max(...rs.map(r => r[1]))];
  }
  return [1, 1]; // scalar argument (string/number/boolean/param ref)
}

function generateEncodings(defs) {
  const seen = new Set();
  const transforms = [];
  for (const kind of ['ColumnTransform', 'AggregateTransform', 'WindowTransform']) {
    for (const { $ref } of defs[kind].anyOf) {
      const name = $ref.split('/').pop();
      const def = defs[name];
      const key = def.required?.[0];
      if (!key || !def.properties?.[key]) throw new Error(`No transform key for ${name}`);
      if (seen.has(key)) {
        console.warn(`Skipping ${name}: duplicate transform key "${key}"`);
        continue;
      }
      seen.add(key);
      transforms.push({ key, prop: def.properties[key] });
    }
  }
  transforms.sort((a, b) => a.key.localeCompare(b.key));

  const out = [HEADER, 'from typing import Any', '', 'from .._types import UNSET, TransformArg', '', '',
    'def _transform(name: str, args: tuple[Any, ...], options: dict[str, Any]) -> dict[str, Any]:',
    '    vals = [a for a in args if a is not UNSET]',
    '    value: Any = vals[0] if len(vals) == 1 else vals or ""',
    '    return {name: value, **options}',
    '', ''];
  const names = [];
  for (const { key, prop } of transforms) {
    const fn = ident(key);
    names.push(fn);
    const [min, max] = argRange(prop);
    const args = (TRANSFORM_ARGS[key] ?? ['col']).slice(0, max);
    while (args.length < max) args.push(`arg${args.length + 1}`);
    const params = args.map((a, i) => `${a}: TransformArg${i < min ? '' : ' | UNSET = UNSET'}`);
    const body = max === 0
      ? `    return {${JSON.stringify(key)}: None, **options}`
      : `    return _transform(${JSON.stringify(key)}, (${args.join(', ')}${args.length === 1 ? ',' : ''}), options)`;
    out.push(
      `def ${fn}(${[...params, '**options: Any'].join(', ')}) -> dict[str, Any]:`,
      `    """${docline(prop.description, `The ${key} transform.`)}"""`,
      body,
      '', '',
    );
  }
  out.push(`__all__ = [\n${names.map(n => `    ${JSON.stringify(n)},`).join('\n')}\n]`, '');
  writeFileSync(resolve(OUT_DIR, 'encodings.py'), out.join('\n').replace(/\n{3,}/g, '\n\n\n'));

  // Shared artifact for ast-to-python.js: the transform keys that have a
  // generated Python function, so the spec emitter needs no hand-kept list.
  writeFileSync(resolve(SPEC_GEN_DIR, 'transform-keys.js'),
    '// DO NOT EDIT. Generated from the Mosaic JSON schema by bin/generate-python-api.js.\n' +
    '// Regenerate with: pnpm run generate:python-api\n\n' +
    '/** Transform keys with a generated vgplot Python API function. */\n' +
    'export const TRANSFORM_KEYS = new Set([\n' +
    transforms.map(({ key }) => `  '${key}',`).join('\n') +
    '\n]);\n');
  return names;
}

function writeInit() {
  writeFileSync(resolve(OUT_DIR, '__init__.py'), HEADER +
    'from .attributes import *  # noqa: F403\n' +
    'from .encodings import *  # noqa: F403\n' +
    'from .marks import *  # noqa: F403\n' +
    'from .attributes import __all__ as _attr_all\n' +
    'from .encodings import __all__ as _enc_all\n' +
    'from .marks import __all__ as _mark_all\n\n' +
    '__all__ = [*_mark_all, *_attr_all, *_enc_all]\n');
}

const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));
const defs = schema.definitions || schema.$defs;
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SPEC_GEN_DIR, { recursive: true });
const markNames = generateMarks(defs);
const attrNames = generateAttributes(defs);
const encNames = generateEncodings(defs);
writeInit();
const all = [...markNames, ...attrNames, ...encNames];
const dupes = all.filter((n, i) => all.indexOf(n) !== i);
if (dupes.length) throw new Error(`Name collisions in generated API: ${dupes.join(', ')}`);
console.log(`Generated ${markNames.length} marks + ${attrNames.length} attributes + ${encNames.length} encodings -> vgplot/_generated/`);
