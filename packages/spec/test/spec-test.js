import assert from 'node:assert';
import ajv from 'ajv';
import ajvFormats from 'ajv-formats';
import { specs, loadJSON, loadJSONSchema, loadESM } from './load-specs.js';
import { astToESM, parseSpec } from '../src/index.js';

// initialize JSON schema validator
const validator = new ajv({
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
    assert.ok(validator.validateSchema(schema));
  });
});

// validate specs, parsing, and generation
for (const [name, spec] of specs) {
  describe(`Test specification: ${name}`, () => {
    it(`produces esm output`, async () => {
      const ast = parseSpec(spec);
      const esm = astToESM(ast);
      assert.strictEqual(esm, await loadESM(name));
    });
    it(`produces json output`, async () => {
      const ast = parseSpec(spec);
      const json = JSON.stringify(ast.toJSON(), 0, 2);
      assert.strictEqual(json, await loadJSON(name));
    });
    it(`round trips json parsing`, () => {
      const ast = parseSpec(spec);
      const json = ast.toJSON();
      assert.strictEqual(
        JSON.stringify(json),
        JSON.stringify(parseSpec(json).toJSON()),
        `${name} did not round trip unchanged`
      );
    });
    it(`passes JSON schema validation`, () => {
      const valid = validate(spec);
      if (!valid) {
        console.error(validate.errors);
      }
      assert.ok(valid);
      assert.ok(parseSpec(spec).toJSON());
    });
  });
}
