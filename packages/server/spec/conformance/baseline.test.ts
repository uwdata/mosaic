import { describe, expect, it } from 'vitest';
import { observedFrom, refreshBaseline, type ResultRow } from './src/baseline.ts';

const source = `# comment stays
server: python
failures:
  - area: GET
    current: x
    spec: y
    fix: z
    cases:
      get/get-arrow:
        - arrow.status.400
      get/large-request-1mib:
        - http.reset.peer-closed|arrow.status.505
`;

const rows = (...items: Array<[string, string, string[]?]>): ResultRow[] =>
  items.map(([id, outcome, violations]) => ({ id, outcome, violations }));

describe('baseline refresh', () => {
  it('refuses a result set with harness errors instead of treating them as passes', () => {
    const withError = rows(['get/get-arrow', 'known', ['arrow.status.400']], ['get/large-request-1mib', 'error']);
    expect(() => observedFrom(withError, 'python-results.json')).toThrow(/harness error.*get\/large-request-1mib/);
    expect(() => observedFrom(rows(['x', 'pass']), 'r')).toThrow(/harness error/);
  });

  it('refuses inherited results with harness errors too', () => {
    const own = observedFrom(rows(['get/get-arrow', 'pass', []]), 'own');
    expect(() => refreshBaseline('server: go-cache\ninherits: go\nfailures: []\n', own, undefined)).toThrow(/inherits go/);
  });

  it('rewrites ids, keeps a satisfied alternative, drops passing cases, and preserves comments', () => {
    const observed = observedFrom(rows(
      ['get/get-arrow', 'known', ['arrow.status.404']],
      ['get/large-request-1mib', 'known', ['arrow.status.505']],
      ['post/new-thing', 'regression', ['error.status.200']],
      ['ws/skipped', 'skipped']
    ), 'own');
    const { text, changes, unfiled } = refreshBaseline(source, observed, undefined);
    expect(text).toContain('# comment stays');
    expect(text).toContain('- arrow.status.404');
    expect(text).not.toContain('arrow.status.400');
    expect(text).toContain('http.reset.peer-closed|arrow.status.505');
    expect(changes).toHaveLength(1);
    expect([...unfiled.entries()]).toEqual([['post/new-thing', ['error.status.200']]]);

    const passing = observedFrom(rows(['get/get-arrow', 'pass', []], ['get/large-request-1mib', 'known', ['arrow.status.505']]), 'own');
    const removed = refreshBaseline(source, passing, undefined);
    expect(removed.text).not.toContain('get/get-arrow');
    expect(removed.changes).toEqual(['removed get/get-arrow (passes)']);
  });

  it('derives passes from the inherited results without inventing them', () => {
    const base = observedFrom(rows(['post/x', 'known', ['error.not-json']], ['post/y', 'known', ['error.not-json']]), 'go');
    const own = observedFrom(rows(['post/x', 'pass', []], ['post/y', 'known', ['error.not-json']]), 'go-cache');
    const { text, changes } = refreshBaseline('server: go-cache\ninherits: go\nfailures: []\n', own, base);
    expect(text).toContain('passes:\n  - post/x');
    expect(changes).toEqual(['passes: (none) -> post/x']);
  });
});
