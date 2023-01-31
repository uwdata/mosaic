import assert from 'node:assert';
import { Coordinator, coordinator } from '../src/index.js';

describe('coordinator', () => {
  it('has accessible singleton', () => {
    const mc = coordinator();
    assert.ok(mc instanceof Coordinator);

    const mc2 = new Coordinator();
    coordinator(mc2);

    assert.strictEqual(mc2, coordinator());
  });
});
