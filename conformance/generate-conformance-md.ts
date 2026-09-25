// Renders the per-server gap tables in STATUS.md from
// known-failures/*.yaml, the files the conformance runner reads.
//
// Run: pnpm -F @uwdata/mosaic-conformance status
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadKnownFailures, readKnownFailuresFile, type KnownFailure } from './src/known.ts';
import { casesOf, targets } from './implementations/index.ts';

const begin = '<!-- conformance:begin -->';
const end = '<!-- conformance:end -->';
const target = path.resolve(import.meta.dirname, 'STATUS.md');

const order = ['go', 'go-cache', 'go-gatekeeper', 'rust', 'python', 'node', 'node-connector', 'wasm'];
const headings: Record<string, string> = {
  go: '## Go `duckdb-server-go`',
  'go-cache': '### With `--cache-control`',
  'go-gatekeeper': '### With `--gatekeeper`',
  rust: '## Rust `duckdb-server`',
  python: '## Python `duckdb-server`',
  node: '## Node `@uwdata/mosaic-duckdb`',
  'node-connector': '## In-process `NodeConnector`',
  wasm: '## In-process `DuckDBWASMConnector`'
};


function cell(text: string) {
  return text.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
}

function renderServer(name: string): string {
  const config = targets[name];
  if (!config) throw new Error(`no server adapter named ${name}`);
  const file = readKnownFailuresFile(name);
  const known = loadKnownFailures(name, casesOf(name), casesOf);
  const transports = config.transports.join(', ') + (config.smoke?.length ? `; smoke cases over ${config.smoke.join(', ')}` : '');
  const lines: string[] = [headings[name], '', `Configuration: ${config.description}. Transports: ${transports}.`];
  if (known.inherits) {
    const inheritedCount = known.inherited.reduce((n, f) => n + Object.keys(f.cases).length, 0);
    lines.push(
      `Everything in the ${headings[known.inherits].replace(/^#+ /, '')} table applies here too` +
      ` (${inheritedCount} inherited case${inheritedCount === 1 ? '' : 's'}` +
      (file.passes?.length ? `; ${file.passes.map(id => `\`${id}\``).join(', ')} pass${file.passes.length === 1 ? 'es' : ''} under this configuration` : '') +
      '). Only the differences are listed.'
    );
  }
  if (file.notes) lines.push('', file.notes.trim());
  lines.push('');
  if (known.own.length === 0) {
    lines.push('No configuration-specific gaps.', '');
    return lines.join('\n');
  }
  lines.push('| Area | Current | Spec | Fix | Cases |', '|------|---------|------|-----|-------|');
  for (const failure of known.own) lines.push(renderRow(failure));
  const withCases = known.own.filter(f => Object.keys(f.cases).length);
  if (withCases.length) {
    lines.push('', '<details><summary>Baselined violations by case</summary>', '');
    for (const failure of withCases) {
      lines.push(`- **${cell(failure.area)}**`);
      for (const [id, violations] of Object.entries(failure.cases)) {
        lines.push(`  - \`${id}\`: ${violations.map(x => `\`${x}\``).join(', ')}`);
      }
    }
    lines.push('', '</details>');
  }
  lines.push('');
  return lines.join('\n');
}

function renderRow(failure: KnownFailure) {
  const count = Object.keys(failure.cases).length;
  const cases = count === 0 ? 'not observable' : `${count}`;
  const ref = failure.ref ? ` (\`${failure.ref}\`)` : '';
  return `| ${cell(failure.area)} | ${cell(failure.current)}${ref} | ${cell(failure.spec)} | ${cell(failure.fix)} | ${cases} |`;
}

export function renderConformanceTables(): string {
  const generated = [
    begin,
    '<!-- Generated from known-failures/*.yaml by generate-conformance-md.ts. Edit the YAML, then run `pnpm -F @uwdata/mosaic-conformance status`. -->',
    '',
    ...order.map(renderServer),
    end
  ];
  return generated.join('\n');
}

const current = readFileSync(target, 'utf8');
const start = current.indexOf(begin);
const stop = current.indexOf(end);
if (start === -1 || stop === -1 || stop < start) {
  throw new Error(`${target} must contain ${begin} and ${end} markers`);
}
const next = current.slice(0, start) + renderConformanceTables() + current.slice(stop + end.length);
if (next !== current) {
  writeFileSync(target, next);
  console.log(`updated ${path.relative(process.cwd(), target)}`);
} else {
  console.log(`${path.relative(process.cwd(), target)} is up to date`);
}
