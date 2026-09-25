import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Reporter, TestCase, TestModule } from 'vitest/node';
import { conformanceRoot } from './cases.ts';
import { annotationTypes } from './harness.ts';

type Outcome = 'pass' | 'known' | 'regression' | 'unexpected-pass' | 'skipped';

interface Row {
  id: string;
  outcome: Outcome;
  area?: string;
  detail?: string;
}

const order: Outcome[] = ['regression', 'unexpected-pass', 'known', 'pass', 'skipped'];
const labels: Record<Outcome, string> = {
  pass: 'passing',
  known: 'known failures',
  regression: 'regressions',
  'unexpected-pass': 'unexpected passes',
  skipped: 'skipped (capability)'
};

export default class ConformanceReporter implements Reporter {
  onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
    const rows: Row[] = [];
    for (const module of testModules) {
      for (const test of module.children.allTests()) rows.push(classify(test));
    }
    rows.sort((a, b) => order.indexOf(a.outcome) - order.indexOf(b.outcome) || a.id.localeCompare(b.id));

    const server = process.env.CONFORMANCE_SERVER ?? 'unknown';
    const summary = renderSummary(server, rows);
    console.log(`\n${summary}`);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);

    const logDir = path.join(conformanceRoot, '.logs');
    mkdirSync(logDir, { recursive: true });
    writeFileSync(path.join(logDir, `${server}-results.json`), JSON.stringify(rows, null, 2));
  }
}

function classify(test: TestCase): Row {
  const result = test.result();
  const annotations = test.annotations();
  const byType = (type: string) => annotations.find(a => a.type === type)?.message;
  const id = test.name;
  if (result.state === 'skipped' || result.state === 'pending') return { id, outcome: 'skipped' };
  if (result.state === 'passed') {
    const area = byType(annotationTypes.known);
    return area
      ? { id, outcome: 'known', area, detail: byType(annotationTypes.actual) }
      : { id, outcome: 'pass' };
  }
  const unexpected = byType(annotationTypes.unexpectedPass);
  if (unexpected) return { id, outcome: 'unexpected-pass', area: unexpected };
  return { id, outcome: 'regression', detail: result.errors?.map(e => e.message).join('; ') };
}

function renderSummary(server: string, rows: Row[]) {
  const counts = Object.fromEntries(order.map(o => [o, rows.filter(r => r.outcome === o).length])) as Record<Outcome, number>;
  const lines = [
    `### Conformance: ${server}`,
    '',
    `| ${order.map(o => labels[o]).join(' | ')} |`,
    `| ${order.map(() => '---:').join(' | ')} |`,
    `| ${order.map(o => counts[o]).join(' | ')} |`,
    ''
  ];
  const attention = rows.filter(r => r.outcome === 'regression' || r.outcome === 'unexpected-pass');
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
