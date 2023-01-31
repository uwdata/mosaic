import assert from 'node:assert';
import { formatDate } from '../src/util/format.js';

describe('formatDate', () => {
  it('formats ISO dates', async () => {
    assert.strictEqual(formatDate(new Date(2012, 0, 1)), '2012-01-01T08:00Z');
    assert.strictEqual(formatDate(new Date('invalid')), 'Invalid Date');
  });
});
