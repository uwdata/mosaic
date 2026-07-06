// Generate the mechanical part of the vgplot Python API (marks + plot
// attributes) from the Mosaic JSON schema, the source of truth produced by the
// JS build (`pnpm run schema`). Interactors, inputs, legends, data sources,
// params, SQL encodings, and the runtime core stay hand-written.
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

  const out = [HEADER, 'from typing import Any', '', 'from ..plot import Mark',
    'from ._types import UNSET, ChannelValue, MarkData', '', ''];
  const names = [];
  for (const { mark, props: propsObj, description } of marks) {
    const fn = ident(mark);
    names.push(fn);
    // Channel/option properties: everything except the `mark` const, `data`,
    // and any non-identifier keys (e.g. a stray `$schema`).
    const props = Object.keys(propsObj)
      .filter(p => p !== 'mark' && p !== 'data' && /^[A-Za-z][A-Za-z0-9]*$/.test(p));
    const params = props.map(p => `    ${ident(p)}: ChannelValue = UNSET,`);
    // enc entries keyed by the exact schema (camelCase) name; runtime camelize is idempotent.
    const encPairs = props.map(p => `        (${JSON.stringify(p)}, ${ident(p)}),`);
    const extra = docline(description, '');
    const doc = extra ? `The ${mark} mark. ${extra}` : `The ${mark} mark.`;
    out.push(
      `def ${fn}(`,
      '    data: MarkData = None,',
      '    *,',
      ...params,
      '    **options: Any,',
      ') -> Mark:',
      `    """${doc}"""`,
      '    enc: dict[str, Any] = dict(options)',
      '    for _key, _val in (',
      ...encPairs,
      '    ):',
      // Preserve explicitly-passed None (e.g. z=None); only drop unpassed params.
      '        if _val is not UNSET:',
      '            enc[_key] = _val',
      `    return Mark(${JSON.stringify(mark)}, data=data, enc=enc or None)`,
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

  const out = [HEADER, 'from ..plot import Directive', 'from ._types import AttrValue', '', ''];
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

function writeTypes() {
  writeFileSync(resolve(OUT_DIR, '_types.py'), HEADER +
    'from typing import Any\n\n' +
    '# Permissive value aliases. Channels/attributes accept column names, constants,\n' +
    '# $param references, and SQL expressions; kept broad to avoid false type errors.\n' +
    'ChannelValue = Any\n' +
    'AttrValue = Any\n' +
    'MarkData = Any\n\n\n' +
    'class _Unset:\n' +
    '    """Sentinel for mark channels that were not passed (distinct from None)."""\n\n' +
    '    def __repr__(self) -> str:\n' +
    '        return "UNSET"\n\n\n' +
    'UNSET: Any = _Unset()\n');
}

function writeInit() {
  writeFileSync(resolve(OUT_DIR, '__init__.py'), HEADER +
    'from .attributes import *  # noqa: F403\n' +
    'from .marks import *  # noqa: F403\n' +
    'from .attributes import __all__ as _attr_all\n' +
    'from .marks import __all__ as _mark_all\n\n' +
    '__all__ = [*_mark_all, *_attr_all]\n');
}

const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));
const defs = schema.definitions || schema.$defs;
mkdirSync(OUT_DIR, { recursive: true });
writeTypes();
const markNames = generateMarks(defs);
const attrNames = generateAttributes(defs);
writeInit();
console.log(`Generated ${markNames.length} marks + ${attrNames.length} attributes -> vgplot/_generated/`);
