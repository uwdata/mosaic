// @vitest-environment jsdom
import { expect, describe, it } from 'vitest';
import { Coordinator } from '@uwdata/mosaic-core';
import { createAPIContext } from '../src/index.js';

describe('array arguments', () => {
  const vg = createAPIContext({ coordinator: new Coordinator() });

  it('plot accepts an array of directives', () => {
    const el = vg.plot([vg.width(300), vg.height(200)]);
    expect(el.value.getAttribute('width')).toBe(300);
    expect(el.value.getAttribute('height')).toBe(200);
  });

  it('vconcat and hconcat accept arrays of elements', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const c = document.createElement('div');
    expect(vg.vconcat([a, b], c).children).toHaveLength(3);
    expect(vg.hconcat([a, b]).children).toHaveLength(2);
  });
});
