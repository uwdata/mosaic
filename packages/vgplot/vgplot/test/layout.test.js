// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { hconcat, vconcat, zconcat } from '../src/index.js';

const el = id => Object.assign(document.createElement('div'), { id });

describe('zconcat', () => {
  it('places every child in the same grid cell, in order', () => {
    const [a, b, c] = ['a', 'b', 'c'].map(el);
    const z = zconcat(a, b, c);
    expect(z.style.display).toBe('grid');
    expect([...z.children].map(d => d.id)).toEqual(['a', 'b', 'c']);
    for (const child of z.children) {
      expect(child.style.gridArea).toBe('1 / 1');
    }
  });

  it('aligns children to the top-left corner of the shared cell', () => {
    const z = zconcat(el('a'));
    expect(z.style.justifyItems).toBe('start');
    expect(z.style.alignItems).toBe('start');
  });

  it('accepts an array of children, like hconcat and vconcat', () => {
    const items = [el('a'), el('b')];
    for (const layout of [hconcat, vconcat, zconcat]) {
      expect([...layout(items).children].map(d => d.id)).toEqual(['a', 'b']);
    }
  });

  it('returns an element that exposes itself as its value', () => {
    const z = zconcat(el('a'));
    expect(z.value.element).toBe(z);
  });

  it('can be nested in the other layouts', () => {
    const inner = zconcat(el('a'), el('b'));
    const outer = vconcat(inner, hconcat(inner.cloneNode(true)));
    expect(outer.children[0]).toBe(inner);
    expect(outer.children[0].children.length).toBe(2);
  });

  it('leaves the other layouts alone', () => {
    expect(hconcat(el('a')).style.display).toBe('flex');
    expect(vconcat(el('a')).style.flexDirection).toBe('column');
    expect(hconcat(el('a')).children[0].style.gridArea).toBe('');
  });
});
