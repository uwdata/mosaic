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

  describe('halign and valign', () => {
    /** @type {import('../src/index.js').Spec} */
    const aligned = {
      zconcat: [{ plot: [{ mark: 'sphere' }] }, { plot: [{ mark: 'graticule' }] }],
      halign: 0.5,
      valign: 1
    };

    it('are kept when converting back to JSON', () => {
      expect(parseSpec(aligned).toJSON()).toEqual(aligned);
      const { root } = parseSpec(aligned);
      expect([root.halign, root.valign]).toEqual([0.5, 1]);
    });

    it('are left out of the JSON when not specified', () => {
      const json = parseSpec({ zconcat: [{ plot: [{ mark: 'sphere' }] }], valign: 0 }).toJSON();
      expect(Object.keys(json)).toEqual(['zconcat', 'valign']);
      expect('halign' in parseSpec(spec).toJSON().vconcat[0].zconcat).toBe(false);
    });

    it('round trip JSON parsing', () => {
      const json = parseSpec(aligned).toJSON();
      expect(JSON.stringify(parseSpec(json).toJSON())).toBe(JSON.stringify(json));
    });

    it('validate against the JSON schema, as numbers only', () => {
      expect(validate(aligned), JSON.stringify(validate.errors)).toBe(true);
      expect(validate({ ...aligned, halign: 'left' })).toBe(false);
      expect(validate({ ...aligned, valign: null })).toBe(false);
    });

    it('are passed to zconcat first in ESM code', () => {
      const code = astToESM(parseSpec(aligned));
      expect(code).toContain('vg.zconcat(');
      expect(code).toContain('{halign: 0.5, valign: 1}');
      expect(code.indexOf('halign')).toBeLessThan(code.indexOf('vg.sphere'));
    });

    it('are passed as keyword arguments after the children in Python code', () => {
      const code = astToPython(parseSpec(aligned));
      expect(code).toContain('halign=0.5');
      expect(code).toContain('valign=1');
      expect(code.indexOf('vg.graticule')).toBeLessThan(code.indexOf('halign='));
    });

    it('are not emitted when unspecified', () => {
      expect(astToESM(parseSpec(spec))).not.toContain('halign');
      expect(astToPython(parseSpec(spec))).not.toContain('halign');
    });
  });

  it('generates Python code that nests its children', () => {
    const code = astToPython(parseSpec(spec));
    expect(code).toContain('vg.zconcat(');
    const z = code.slice(code.indexOf('vg.zconcat('));
    expect(z.indexOf('vg.sphere')).toBeLessThan(z.indexOf('vg.hconcat('));
    expect(z.indexOf('vg.hconcat(')).toBeLessThan(z.indexOf('vg.graticule'));
  });
});
