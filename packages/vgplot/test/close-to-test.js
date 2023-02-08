import assert from 'node:assert';
import { closeTo } from '../src/interactors/util/close-to.js';

describe('closeTo', () => {
  it('tests if two ranges are nearly identical', async () => {
    assert.strictEqual(closeTo([0, 1], [0, 1]), true);
    assert.strictEqual(closeTo([0, 1], [1e-14, 1 - 1e-14]), true);
    assert.strictEqual(closeTo(null, null), true);
    assert.strictEqual(closeTo(undefined, undefined), true);
    assert.strictEqual(closeTo([0, 1], [1, 2]), false);
    assert.strictEqual(closeTo(null, [0, 1]), false);
    assert.strictEqual(closeTo([0, 1], null), false);
  });
});
