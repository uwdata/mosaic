import { describe, it, expect } from 'vitest';
import { astToPython } from '../src/ast-to-python.js';
import { parseSpec } from '../src/index.js';

// Build a minimal AST stand-in: astToPython only calls ast.toJSON().
const ast = json => ({ toJSON: () => json });

describe('astToPython literals', () => {
  it('emits valid Python for non-finite numbers', () => {
    const code = astToPython(ast({ params: { a: NaN, b: Infinity, c: -Infinity } }));
    expect(code).toContain("a = vg.param(float('nan'))");
    expect(code).toContain("b = vg.param(float('inf'))");
    expect(code).toContain("c = vg.param(float('-inf'))");
    // The bare JS tokens NaN/Infinity would be a NameError in Python.
    expect(code).not.toMatch(/vg\.param\((NaN|Infinity|-Infinity)\)/);
  });

  it('escapes keyword-named kwargs via dict unpacking', () => {
    const code = astToPython(
      ast({ plot: [{ mark: 'dot', channels: { class: 'c', id: 'i' } }] })
    );
    // `class=...` is a SyntaxError; emit **{'class': ...} instead.
    expect(code).toContain('**{"class": "c"}');
    expect(code).toContain('id="i"');
  });

  it('emits ordinary numbers unchanged', () => {
    const code = astToPython(ast({ params: { a: 42, b: 1.5, c: -3 } }));
    expect(code).toContain('a = vg.param(42)');
    expect(code).toContain('b = vg.param(1.5)');
    expect(code).toContain('c = vg.param(-3)');
  });
});

describe('astToPython transforms', () => {
  const lineY = y => ast({ plot: [{ mark: 'lineY', x: 'day', y }] });

  it('emits nested transforms and transform-valued orderby as calls', () => {
    const code = astToPython(lineY({
      sum: { sum: 'precipitation' },
      orderby: { dateMonth: 'date' },
    }));
    expect(code).toContain(
      'y=vg.sum(vg.sum("precipitation"), orderby=vg.date_month("date"))'
    );
  });

  it('emits sql expressions inside transform arguments', () => {
    const code = astToPython(lineY({ sum: { sql: 'amount' } }));
    expect(code).toContain('y=vg.sum(vg.sql("amount"))');
  });

  it('emits orderby lists mixing transforms and columns', () => {
    const code = astToPython(lineY({
      sum: 'amount',
      orderby: [{ dateMonth: 'date' }, 'day'],
      partitionby: 'region',
    }));
    expect(code).toContain(
      'y=vg.sum("amount", orderby=[vg.date_month("date"), "day"], partitionby="region")'
    );
  });

  it('emits nested transforms from a parsed spec', () => {
    const spec = parseSpec({
      plot: [{
        mark: 'lineY',
        data: { from: 'weather' },
        x: 'day',
        y: { sum: { sum: 'precipitation' }, orderby: { dateMonth: 'date' } },
      }],
    });
    expect(astToPython(spec)).toContain(
      'y=vg.sum(vg.sum("precipitation"), orderby=vg.date_month("date"))'
    );
  });
});
