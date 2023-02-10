import assert from 'node:assert';
import { register, unregister } from 'timezone-mock';
import { formatDate } from '../src/util/format.js';

describe('formatDate', () => {
  it('formats ISO dates', async () => {
    register('US/Eastern');
    assert.strictEqual(formatDate(new Date(2012, 0, 1)), '2012-01-01T05:00Z');
    unregister();
  });

  it('formats invalid ISO dates', async () => {
    assert.strictEqual(formatDate(new Date('invalid')), 'Invalid Date');
  });
});
