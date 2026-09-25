import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Reporter, TestCase, TestModule } from 'vitest/node';
import { conformanceRoot } from './cases.ts';
import { annotationTypes, parseSkipNote, type SkipCategory } from './harness.ts';

type Outcome = 'pass' | 'known' | 'regression' | 'resolved' | 'error' | 'skipped';

interface Row {
  id: string;
  outcome: Outcome;
  skip?: SkipCategory;
  reason?: string;
  area?: string;
  detail?: string;
  violations?: string[];
}

const order: Outcome[] = ['error', 'regression', 'resolved', 'known', 'pass', 'skipped'];
const labels: Record<Outcome, string> = {
  error: 'harness errors',
  regression: 'regressions',
  resolved: 'resolved (remove from baseline)',
  known: 'known failures',
  pass: 'passing',
  skipped: 'skipped (capability / layer)'
};

export default class ConformanceReporter implements Reporter {
  onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
    const rows: Row[] = [];
    for (const module of testModules) {
      for (const test of module.children.allTests()) rows.push(classify(test));
    }
    rows.sort((a, b) => order.indexOf(a.outcome) - order.indexOf(b.outcome) || a.id.localeCompare(b.id));

    const server = process.env.CONFORMANCE_TARGET ?? 'unknown';
    const summary = renderSummary(server, rows);
    console.log(`\n${summary}`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);

    const logDir = path.join(conformanceRoot, '.logs');
    mkdirSync(logDir, { recursive: true });
    writeFileSync(path.join(logDir, `${server}-results.json`), JSON.stringify(rows, null, 2));
  }
}

// A test with a regression annotation failed on new violations; one with only
// a resolved annotation failed because baselined violations vanished; a
// failure with neither annotation is a thrown transport or harness error.
function classify(test: TestCase): Row {
  const result = test.result();
  const annotations = test.annotations();
  const byType = (type: string) => annotations.find(a => a.type === type)?.message;
  const id = test.name;
  if (result.state === 'skipped') {
    const skip = parseSkipNote(result.note);
    return skip ? { id, outcome: 'skipped', skip: skip.category, reason: skip.reason } : { id, outcome: 'skipped' };
  }
  if (result.state === 'pending') return { id, outcome: 'skipped' };
  const area = byType(annotationTypes.known);
  const observed = byType(annotationTypes.observed);
  const regression = byType(annotationTypes.regression);
  const violations = [...idsIn(observed), ...idsIn(regression)];
  if (result.state === 'passed') {
    return area ? { id, outcome: 'known', area, detail: observed, violations } : { id, outcome: 'pass', violations: [] };
  }
  if (regression) return { id, outcome: 'regression', area, detail: regression, violations };
  const resolved = byType(annotationTypes.resolved);
  if (resolved) return { id, outcome: 'resolved', area, detail: resolved, violations };
  return { id, outcome: 'error', detail: result.errors?.map(e => e.message).join('; ') };
}

function idsIn(message: string | undefined): string[] {
  if (!message) return [];
  return message.split('\n').map(line => line.split(': ')[0]).filter(Boolean);
}

function renderSummary(server: string, rows: Row[]) {
  const counts = Object.fromEntries(order.map(o => [o, rows.filter(r => r.outcome === o).length])) as Record<Outcome, number>;
  const skips = (category: string) => rows.filter(r => r.outcome === 'skipped' && r.skip === category).length;
  const cell = (o: Outcome) => (o === 'skipped' ? `${skips('capability')} / ${skips('layer')}` : String(counts[o]));
  const lines = [
    `### Conformance: ${server}`,
    '',
    `| ${order.map(o => labels[o]).join(' | ')} |`,
    `| ${order.map(() => '---:').join(' | ')} |`,
    `| ${order.map(cell).join(' | ')} |`,
    ''
  ];
  const attention = rows.filter(r => r.outcome === 'error' || r.outcome === 'regression' || r.outcome === 'resolved');
  if (attention.length) {
    lines.push('| case | outcome | detail |', '|---|---|---|');
    for (const row of attention) {
      lines.push(`| \`${row.id}\` | ${row.outcome} | ${escapeCell(row.detail ?? row.area ?? '')} |`);
    }
    lines.push('');
  }
  const known = rows.filter(r => r.outcome === 'known');
  if (known.length) {
    lines.push('<details><summary>Known failures</summary>', '', '| case | area | observed |', '|---|---|---|');
    for (const row of known) {
      lines.push(`| \`${row.id}\` | ${escapeCell(row.area ?? '')} | ${escapeCell(row.detail ?? '')} |`);
    }
    lines.push('', '</details>', '');
  }
  return lines.join('\n');
}

function escapeCell(text: string) {
  const oneLine = text.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
  return oneLine.length > 300 ? `${oneLine.slice(0, 300)}…` : oneLine;
}
