import { describe, expect, it } from 'vitest';
import { expandCases, layersOf, loadCaseDefinitions } from './src/cases.ts';
import { targets } from './implementations/index.ts';

// Every case, its wire transports, its layers, and whether it is a smoke
// case. This is the contract the inference in `layersOf` has to reproduce:
// a case that changes classification changes this table in the same diff.
const expected: Array<[id: string, wire: string, layers: string, smoke?: true]> = [
  ['arrow-stream-format', 'post ws', 'wire command', true],
  ['arrow-empty-result', 'post ws', 'wire command'],
  ['arrow-scalar-types', 'post ws', 'wire command'],
  ['arrow-many-rows', 'post ws', 'wire command'],
  ['arrow-from-parquet', 'post', 'wire command'],
  ['large-request-1mib', 'post get ws', 'wire'],
  ['cache-get-etag', 'get', 'wire'],
  ['cache-if-none-match', 'get', 'wire'],
  ['cache-if-none-match-weak', 'get', 'wire'],
  ['cache-if-none-match-miss', 'get', 'wire'],
  ['cache-if-match', 'get', 'wire'],
  ['cache-error-no-store', 'get', 'wire'],
  ['cache-post-no-store', 'post', 'wire'],
  ['cache-preflight-no-store', 'post', 'wire'],
  ['comm-missing-uuid', 'comm', 'wire'],
  ['comm-empty-uuid', 'comm', 'wire'],
  ['comm-invalid-uuid-not-executed', 'comm', 'wire'],
  ['comm-pipeline-association', 'comm', 'wire'],
  ['sql-parse-error', 'post ws', 'wire command', true],
  ['sql-unknown-table', 'post ws', 'wire command'],
  ['sql-runtime-error', 'post ws', 'wire command'],
  ['exec-error', 'post ws', 'wire command'],
  ['method-put', 'post', 'wire'],
  ['method-head', 'post', 'wire'],
  ['cors-preflight', 'post', 'wire'],
  ['arrow-cors-origin', 'post', 'wire'],
  ['policy-denied-file', 'post get ws', 'wire command'],
  ['preagg-unsupported', 'post ws', 'wire command'],
  ['preagg-materialize', 'post ws', 'wire command'],
  ['preagg-not-read-only', 'post ws', 'wire command'],
  ['missing-type', 'post ws', 'wire command'],
  ['missing-sql', 'post ws', 'wire command'],
  ['empty-sql', 'post ws', 'wire command'],
  ['unknown-type', 'post ws', 'wire command'],
  ['type-not-a-string', 'post ws', 'wire command'],
  ['malformed-json-body', 'post', 'wire'],
  ['application-fields-pass-through', 'post ws', 'wire command'],
  ['protocol-fields-not-shadowed', 'post ws', 'wire command'],
  ['content-type-not-json', 'post', 'wire'],
  ['content-type-with-charset', 'post', 'wire'],
  ['arrow-trailing-semicolon', 'post ws', 'wire command'],
  ['arrow-multi-statement', 'post get ws', 'wire command'],
  ['exec-acknowledged', 'post ws', 'wire command', true],
  ['exec-multi-statement', 'post ws', 'wire command'],
  ['exec-unsupported', 'post ws', 'wire command'],
  ['get-arrow', 'get', 'wire'],
  ['get-plus-in-sql', 'get', 'wire'],
  ['get-missing-type', 'get', 'wire'],
  ['get-json-wrapped-query-rejected', 'get', 'wire'],
  ['get-exec-rejected', 'get', 'wire'],
  ['get-preagg-rejected', 'get', 'wire'],
  ['get-ddl-rejected', 'get', 'wire'],
  ['get-delete-returning-rejected', 'get', 'wire'],
  ['get-cte-allowed', 'get', 'wire'],
  ['get-set-operation-allowed', 'get', 'wire'],
  ['ws-malformed-json-stays-open', 'ws', 'wire'],
  ['ws-missing-sql-stays-open', 'ws', 'wire command'],
  ['ws-sql-error-stays-open', 'ws', 'wire command', true],
  ['ws-binary-frame', 'ws', 'wire'],
  ['ws-pipeline-order', 'ws', 'wire command', true],
  ['ws-pipeline-slow-first', 'ws', 'wire command']
];

describe('case applicability', () => {
  const definitions = loadCaseDefinitions();

  it('classifies every case exactly as listed', () => {
    const actual = definitions.map(d => [d.id, (d.transports ?? ['post', 'ws']).join(' '), layersOf(d).join(' '), ...(d.smoke ? [true] : [])]);
    expect(actual).toEqual(expected);
  });

  it('expands the reference server over both clients and the others over smoke cases only', () => {
    const go = expandCases(definitions, targets.go).map(c => c.id);
    const node = expandCases(definitions, targets.node).map(c => c.id);
    const command = expected.filter(([, , layers]) => layers.includes('command')).length;
    expect(go.filter(id => id.startsWith('rest/'))).toHaveLength(definitions.length);
    expect(go.filter(id => id.startsWith('rest/') && !id.includes('/get-'))).toContain('rest/arrow-from-parquet');
    expect(node.filter(id => id.startsWith('rest/'))).toEqual(expected.filter(([, , , smoke]) => smoke).map(([id]) => `rest/${id}`));
    expect(node.filter(id => id.startsWith('post/'))).toEqual(go.filter(id => id.startsWith('post/')));
    const applicable = expandCases(definitions, targets.go).filter(c => c.transport === 'rest' && c.applicable);
    expect(applicable).toHaveLength(command);
  });

  it('expands the widget over comm: every command-level case plus the comm-only ones, nothing HTTP or frame specific', () => {
    const widget = expandCases(definitions, targets.widget);
    expect(widget.every(c => c.transport === 'comm' && c.applicable)).toBe(true);
    const ids = widget.map(c => c.id);
    expect(ids).toContain('comm/comm-missing-uuid');
    expect(ids).toContain('comm/sql-parse-error');
    expect(ids).toContain('comm/ws-pipeline-order');
    expect(ids).not.toContain('comm/method-put');
    expect(ids).not.toContain('comm/large-request-1mib');
    expect(ids).not.toContain('comm/get-arrow');
    expect(expandCases(definitions, targets.go).map(c => c.id)).not.toContain('comm/comm-missing-uuid');
  });

  it('expands an in-process target over inproc only, skipping wire-only cases by layer', () => {
    const wasm = expandCases(definitions, targets.wasm);
    expect(wasm).toHaveLength(definitions.length);
    expect(wasm.every(c => c.transport === 'inproc')).toBe(true);
    expect(wasm.filter(c => c.applicable).map(c => c.id)).toContain('inproc/arrow-from-parquet');
    expect(wasm.find(c => c.id === 'inproc/large-request-1mib')).toMatchObject({ applicable: false });
  });

  it('marks a wire-only case reaching a command transport as not applicable', () => {
    const c = expandCases(definitions, targets.go).find(x => x.id === 'socket/method-put')!;
    expect(c).toMatchObject({ layer: 'command', applicable: false });
    const p = expandCases(definitions, targets.go).find(x => x.id === 'post/method-put')!;
    expect(p).toMatchObject({ layer: 'wire', applicable: true });
  });
});
