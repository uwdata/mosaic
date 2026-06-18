import { describe, it, expect } from 'vitest';
import { astToPython } from '../src/ast-to-python.js';

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

  it('emits ordinary numbers unchanged', () => {
    const code = astToPython(ast({ params: { a: 42, b: 1.5, c: -3 } }));
    expect(code).toContain('a = vg.param(42)');
    expect(code).toContain('b = vg.param(1.5)');
    expect(code).toContain('c = vg.param(-3)');
  });
});
