// Renders the per-server gap tables in ../CONFORMANCE.md from
// known-failures/*.yaml, the files the conformance runner reads.
//
// Run: pnpm -F @uwdata/mosaic-server-spec conformance:docs
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadCases } from './src/cases.ts';
import { connectorCaseIds } from './src/connector-cases.ts';
import { loadKnownFailures, readKnownFailuresFile, type KnownFailure } from './src/known.ts';
import { servers } from './servers/index.ts';

const begin = '<!-- conformance:begin -->';
const end = '<!-- conformance:end -->';
const target = path.resolve(import.meta.dirname, '..', 'CONFORMANCE.md');

const order = ['go', 'go-cache', 'go-gatekeeper', 'rust', 'python', 'node'];
const headings: Record<string, string> = {
  go: '## Go `duckdb-server-go`',
  'go-cache': '### With `--cache-control`',
  'go-gatekeeper': '### With `--gatekeeper`',
  rust: '## Rust `duckdb-server`',
  python: '## Python `duckdb-server`',
  node: '## Node `@uwdata/mosaic-duckdb`'
};

const caseIds = new Set([...loadCases().map(c => c.id), ...connectorCaseIds]);

function cell(text: string) {
  return text.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
}

function renderServer(name: string): string {
  const config = servers[name];
  if (!config) throw new Error(`no server adapter named ${name}`);
  const file = readKnownFailuresFile(name);
  const known = loadKnownFailures(name, caseIds);
  const lines: string[] = [headings[name], '', `Configuration: ${config.description}.`];
  if (known.inherits) {
    const inheritedCount = known.inherited.reduce((n, f) => n + f.cases.length, 0);
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
  const withCases = known.own.filter(f => f.cases.length);
  if (withCases.length) {
    lines.push('', '<details><summary>Case ids</summary>', '');
    for (const failure of withCases) {
      lines.push(`- **${cell(failure.area)}**: ${failure.cases.map(id => `\`${id}\``).join(', ')}`);
    }
    lines.push('', '</details>');
  }
  lines.push('');
  return lines.join('\n');
}

function renderRow(failure: KnownFailure) {
  const count = failure.cases.length;
  const cases = count === 0 ? 'not observable' : `${count}`;
  const ref = failure.ref ? ` (\`${failure.ref}\`)` : '';
  return `| ${cell(failure.area)} | ${cell(failure.current)}${ref} | ${cell(failure.spec)} | ${cell(failure.fix)} | ${cases} |`;
}

export function renderConformanceTables(): string {
  const generated = [
    begin,
    '<!-- Generated from conformance/known-failures/*.yaml by conformance/generate-conformance-md.ts. Edit the YAML, then run `pnpm -F @uwdata/mosaic-server-spec conformance:docs`. -->',
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
