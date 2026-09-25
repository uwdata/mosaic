import { describe, it, expect } from 'vitest';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { loadJSONSchema } from './load-specs.js';
import { astToESM, astToPython, parseSpec } from '../src/index.js';

const validator = new Ajv({ allErrors: true, allowUnionTypes: true, verbose: true });
addFormats.default(validator);
const validate = validator.compile(await loadJSONSchema());

// two plots layered in order, one containing an hconcat, inside a vconcat
// (typed, so this also checks that ZConcat is part of the Spec type)
/** @type {import('../src/index.js').Spec} */
const spec = {
  vconcat: [
    {
      zconcat: [
        { plot: [{ mark: 'sphere' }], projectionType: 'orthographic' },
        { hconcat: [{ hspace: 10 }, { vspace: 5 }] },
        { plot: [{ mark: 'graticule' }], projectionType: 'orthographic' }
      ]
    },
    { hspace: 8 }
  ]
};

describe('zconcat', () => {
  it('parses to a layout whose children keep their order', () => {
    const { root } = parseSpec(spec);
    const z = root.children[0];
    expect(z.type).toBe('zconcat');
    expect(z.children.map(c => c.type)).toEqual(['plot', 'hconcat', 'plot']);
  });

  it('converts back to JSON unchanged', () => {
    expect(parseSpec(spec).toJSON()).toEqual(spec);
  });

  it('round trips JSON parsing', () => {
    const json = parseSpec(spec).toJSON();
    expect(JSON.stringify(parseSpec(json).toJSON())).toBe(JSON.stringify(json));
  });

  it('validates against the JSON schema', () => {
    expect(validate(spec), JSON.stringify(validate.errors)).toBe(true);
  });

  it('is rejected by the JSON schema when it is not a list of components', () => {
    expect(validate({ zconcat: 'plot' })).toBe(false);
    expect(validate({ zconcat: [{ nonsense: true }] })).toBe(false);
  });

  it('generates ESM code that nests its children', () => {
    const code = astToESM(parseSpec(spec));
    expect(code).toContain('vg.zconcat(');
    // children come out in order, inside the zconcat call
    const z = code.slice(code.indexOf('vg.zconcat('));
    expect(z.indexOf('vg.sphere')).toBeLessThan(z.indexOf('vg.hconcat('));
    expect(z.indexOf('vg.hconcat(')).toBeLessThan(z.indexOf('vg.graticule'));
  });

  it('generates Python code that nests its children', () => {
    const code = astToPython(parseSpec(spec));
    expect(code).toContain('vg.zconcat(');
    const z = code.slice(code.indexOf('vg.zconcat('));
    expect(z.indexOf('vg.sphere')).toBeLessThan(z.indexOf('vg.hconcat('));
    expect(z.indexOf('vg.hconcat(')).toBeLessThan(z.indexOf('vg.graticule'));
  });
});
