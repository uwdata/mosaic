import { describe, expect, it } from 'vitest';
import { inheritedFrom, observedFrom, refreshBaseline, type ResultRow } from './src/baseline.ts';
import { rejectionStatus } from './src/connector-cases.ts';

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
const skipped = (id: string, reason: string): ResultRow => ({ id, outcome: 'skipped', reason });

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
    const { text, changes, unverified } = refreshBaseline('server: go-cache\ninherits: go\nfailures: []\n', own, base);
    expect(text).toContain('passes:\n  - post/x');
    expect(changes).toEqual(['passes: (none) -> post/x']);
    expect(unverified).toEqual([]);
  });

  const inheriting = `server: go-gatekeeper
inherits: go
passes:
  - connector/rest-error
failures:
  - area: Disabled exec
    current: x
    spec: y
    fix: z
    cases:
      ws/exec-unsupported:
        - error.code.bad_request
`;
  const goResults = observedFrom(rows(
    ['connector/rest-error', 'known', ['connector.status']],
    ['post/arrow-trailing-semicolon', 'pass', []],
    ['ws/exec-unsupported', 'pass', []]
  ), 'go');

  it('leaves exemptions and entries for cases a filtered run did not observe', () => {
    const partial = observedFrom(rows(['post/arrow-trailing-semicolon', 'pass', []], ['connector/rest-error', 'skipped'], ['ws/exec-unsupported', 'skipped']), 'go-gatekeeper');
    const { text, changes, unfiled } = refreshBaseline(inheriting, partial, goResults);
    expect(changes).toEqual([]);
    expect(text).toBe(inheriting);
    expect(unfiled.size).toBe(0);
  });

  it('still drops an exemption once the case is observed failing', () => {
    const observed = observedFrom(rows(['connector/rest-error', 'known', ['connector.status']]), 'go-gatekeeper');
    const { text, changes } = refreshBaseline(inheriting, observed, goResults);
    expect(changes).toEqual(['passes: connector/rest-error -> (none)']);
    expect(text).not.toContain('passes:');
  });

  it('does not judge a case against an inherited run that never observed it', () => {
    const base = observedFrom(rows(['post/other', 'pass', []]), 'go');
    const observed = observedFrom(rows(['ws/exec-unsupported', 'known', ['error.code.bad_request']], ['post/new', 'regression', ['error.status.500']]), 'go-gatekeeper');
    const { text, changes, unfiled, unverified } = refreshBaseline(inheriting, observed, base);
    expect(changes).toEqual([]);
    expect(text).toBe(inheriting);
    expect(unfiled.size).toBe(0);
    expect(unverified).toEqual(['post/new', 'ws/exec-unsupported']);
  });

  it('keeps an override that now passes when the inherited run never observed it', () => {
    const base = observedFrom(rows(['post/other', 'pass', []]), 'go');
    const observed = observedFrom(rows(['ws/exec-unsupported', 'pass', []]), 'go-gatekeeper');
    const { text, changes, unverified } = refreshBaseline(inheriting, observed, base);
    expect(changes).toEqual([]);
    expect(text).toBe(inheriting);
    expect(unverified).toEqual(['ws/exec-unsupported']);
    const verified = refreshBaseline(inheriting, observed, observedFrom(rows(['ws/exec-unsupported', 'known', ['error.code.bad_request']]), 'go'));
    expect(verified.changes).toEqual(['removed ws/exec-unsupported (passes)', 'passes: connector/rest-error -> connector/rest-error, ws/exec-unsupported']);
  });

  it('tells a capability skip in the inherited run from a filtered one', () => {
    const goRows = [...rows(['post/other', 'pass', []], ['ws/filtered', 'skipped']), skipped('ws/exec-unsupported', 'only when exec is unavailable'), skipped('post/new', 'requires policy')];
    expect([...inheritedFrom(goRows, 'go').keys()].sort()).toEqual(['post/new', 'post/other', 'ws/exec-unsupported']);
    expect([...observedFrom(goRows, 'go').keys()]).toEqual(['post/other']);
    const base = inheritedFrom(goRows, 'go');
    const passing = refreshBaseline(inheriting, observedFrom(rows(['ws/exec-unsupported', 'pass', []]), 'go-gatekeeper'), base);
    expect(passing.changes).toEqual(['removed ws/exec-unsupported (passes)']);
    expect(passing.text).not.toContain('ws/exec-unsupported');
    expect(passing.unverified).toEqual([]);
    const failing = refreshBaseline(inheriting, observedFrom(rows(['ws/exec-unsupported', 'known', ['error.code.bad_request']], ['post/new', 'regression', ['error.status.500']]), 'go-gatekeeper'), base);
    expect(failing.changes).toEqual([]);
    expect([...failing.unfiled.keys()]).toEqual(['post/new']);
    expect(failing.unverified).toEqual([]);
  });
});

describe('cases split across areas', () => {
  const split = `server: node
failures:
  - area: Format
    current: a
    spec: b
    fix: c
    cases:
      ws/arrow-stream-format:
        - arrow.eos
      ws/only-format:
        - arrow.eos
  - area: Rows
    current: a
    spec: b
    fix: c
    cases:
      ws/arrow-stream-format:
        - arrow.rows
`;
  const refresh = (...items: Array<[string, string, string[]?]>) => refreshBaseline(split, observedFrom(rows(...items), 'node'), undefined);

  it('leaves an unchanged split case alone instead of copying every id into each area', () => {
    const { text, changes, unowned } = refresh(['ws/arrow-stream-format', 'known', ['arrow.rows', 'arrow.eos']]);
    expect(changes).toEqual([]);
    expect(text).toBe(split);
    expect(unowned.size).toBe(0);
  });

  it('drops only the area whose ids resolved', () => {
    const { text, changes } = refresh(['ws/arrow-stream-format', 'known', ['arrow.rows']]);
    expect(changes).toEqual(['removed ws/arrow-stream-format (Format): arrow.eos no longer observed']);
    expect(text).toContain('      ws/only-format:\n        - arrow.eos\n  - area: Rows');
    expect(text).toContain('      ws/arrow-stream-format:\n        - arrow.rows\n');
    expect(text.match(/ws\/arrow-stream-format/g)).toHaveLength(1);
  });

  it('reports a new id on a split case for placement rather than guessing an area', () => {
    const { text, changes, unowned, unfiled } = refresh(['ws/arrow-stream-format', 'regression', ['arrow.rows', 'arrow.eos', 'arrow.content-type']]);
    expect(changes).toEqual([]);
    expect(text).toBe(split);
    expect([...unowned.entries()]).toEqual([['ws/arrow-stream-format', ['arrow.content-type']]]);
    expect(unfiled.size).toBe(0);
    const single = refresh(['ws/only-format', 'regression', ['arrow.eos', 'arrow.rows']]);
    expect(single.changes).toEqual(['updated ws/only-format: arrow.eos -> arrow.eos, arrow.rows']);
    expect(single.unowned.size).toBe(0);
  });
});

describe('connector rejection status', () => {
  it('prefers the structured status and falls back to the base connector message only', () => {
    expect(rejectionStatus(Object.assign(new Error('syntax error at SELEC'), { status: 400, code: 'bad_request' }))).toBe(400);
    expect(rejectionStatus(new Error('Query failed with HTTP status 400: {"error":"x"}'))).toBe(400);
    expect(rejectionStatus(new Error('syntax error at SELEC'))).toBeUndefined();
    expect(rejectionStatus(new Error('the server said HTTP status 400 was wrong'))).toBeUndefined();
    expect(rejectionStatus('not an error')).toBeUndefined();
  });
});
