import assert from 'node:assert';
import { specs, loadJSON, loadESM } from './load-specs.js';
import { astToESM, parseSpec } from '../src/index.js';

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
  });
}
