import assert from 'node:assert';
import { specs, loadJSON, loadESM, writeESM, writeJSON } from './load-specs.js';
import { astToESM, parseSpec } from '../src/index.js';

// DANGER! If set true, the expected test data will be overwritten!
// Only use after confirming all generated results are correct.
const WRITE = false;

for (const [name, spec] of specs) {
  describe(`Test specification: ${name}`, () => {
    it(`produces esm output`, async () => {
      const ast = parseSpec(spec);
      const esm = astToESM(ast);
      if (WRITE) await writeESM(name, esm);
      assert.strictEqual(esm, await loadESM(name));
    });
    it(`produces json output`, async () => {
      const ast = parseSpec(spec);
      const json = JSON.stringify(ast.toJSON(), 0, 2);
      if (WRITE) await writeJSON(name, json);
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
