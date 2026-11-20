// @vitest-environment jsdom
import { expect, describe, it } from 'vitest';
import { Coordinator } from '@uwdata/mosaic-core';
import { createAPIContext } from '../src/index.js';

describe('marks', () => {
  const vg = createAPIContext({ coordinator: new Coordinator() });

  it('vectorX creates a vectorX mark', () => {
    const el = vg.plot(vg.vectorX([{ x: 1 }], { x: 'x' }));
    expect(el.value.marks[0].type).toBe('vectorX');
  });
});
