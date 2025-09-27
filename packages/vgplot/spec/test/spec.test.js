import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import ajvFormats from 'ajv-formats';
import { specs, loadJSON, loadJSONSchema, loadESM } from './load-specs.js';
import { astToESM, parseSpec } from '../src/index.js';

// initialize JSON schema validator
const validator = new Ajv({
  allErrors: true,
  allowUnionTypes: true,
  verbose: true
});
ajvFormats(validator);
const schema = await loadJSONSchema();
const validate = validator.compile(schema);

// validate JSON schema
describe('JSON schema', () => {
  it('is a valid JSON schema', () => {
    expect(validator.validateSchema(schema)).toBe(true);
  });
});

// generate specs list snapshot
describe('Specs list', () => {
  it('generates specs.json snapshot', async () => {
    const specsList = Array.from(specs.keys()).sort();
    await expect(JSON.stringify(specsList, null, 2)).toMatchFileSnapshot('./specs.json');
  });
});

// validate specs, parsing, and generation
for (const [name, spec] of specs) {
  describe(`Test specification: ${name}`, () => {
    it(`produces esm output`, async () => {
      const ast = parseSpec(spec);
      const esm = astToESM(ast);
      expect(esm).toBe(await loadESM(name));
    });
    it(`produces json output`, async () => {
      const ast = parseSpec(spec);
      const json = JSON.stringify(ast.toJSON(), 0, 2);
      expect(json).toBe(await loadJSON(name));
    });
    it(`round trips json parsing`, () => {
      const ast = parseSpec(spec);
      const json = ast.toJSON();
      expect(JSON.stringify(json)).toBe(
        JSON.stringify(parseSpec(json).toJSON()),
        `${name} did not round trip unchanged`
      );
    });
    it(`passes JSON schema validation`, () => {
      const valid = validate(spec);
      if (!valid) {
        console.error(validate.errors);
      }
      expect(valid).toBe(true);
      expect(parseSpec(spec).toJSON()).toBeTruthy();
    });
  });
}
