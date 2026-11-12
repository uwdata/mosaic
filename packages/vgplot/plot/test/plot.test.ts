import { describe, it, expect } from 'vitest';
import { Plot } from '../src/index.js';

describe('Plot', () => {
    /** Placeholder for a test that imports from `index.js`
     * Without this, `tsc -p test/tsconfig.json` won't typecheck the full package
     */
    it('is brought into scope', () => {
        expect(() => new Plot()).toThrow(ReferenceError);
    });
});