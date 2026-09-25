// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { hconcat, vconcat, zconcat } from '../src/index.js';

const el = id => Object.assign(document.createElement('div'), { id });

/**
 * The child elements of a layout, typed so their styles can be inspected.
 * @param {Element} layout
 * @returns {HTMLElement[]}
 */
const kids = layout => /** @type {HTMLElement[]} */ ([...layout.children]);

describe('zconcat', () => {
  it('places every child in the same grid cell, in order', () => {
    const [a, b, c] = ['a', 'b', 'c'].map(el);
    const z = zconcat(a, b, c);
    expect(z.style.display).toBe('grid');
    expect(kids(z).map(d => d.id)).toEqual(['a', 'b', 'c']);
    for (const child of kids(z)) {
      expect(child.style.gridArea).toBe('1 / 1');
    }
  });

  it('aligns children to the top-left corner of the shared cell', () => {
    const z = zconcat(el('a'));
    expect(z.style.justifyItems).toBe('start');
    expect(z.style.alignItems).toBe('start');
  });

  it('shrink-wraps its largest child instead of filling the available width', () => {
    // alignment fractions are relative to the layout, so it must not stretch
    expect(zconcat(el('a')).style.width).toBe('fit-content');
  });

  it('leaves children untouched unless an alignment is given', () => {
    const [a] = kids(zconcat(el('a')));
    expect(a.style.position).toBe('');
    expect(a.style.left).toBe('');
    expect(a.style.transform).toBe('');
  });

  describe('halign and valign', () => {
    it('offset each child by that fraction of the space around it', () => {
      const [a, b] = kids(zconcat({ halign: 0.5, valign: 0.25 }, el('a'), el('b')));
      for (const child of [a, b]) {
        expect(child.style.position).toBe('relative');
        expect(child.style.left).toBe('50%');
        expect(child.style.top).toBe('25%');
        expect(child.style.transform).toBe('translate(-50%, -25%)');
        expect(child.style.gridArea).toBe('1 / 1');
      }
    });

    it('can be given one at a time, the other staying at 0', () => {
      const [h] = kids(zconcat({ halign: 1 }, el('a')));
      expect([h.style.left, h.style.top]).toEqual(['100%', '0%']);
      const [v] = kids(zconcat({ valign: 1 }, el('a')));
      expect([v.style.left, v.style.top]).toEqual(['0%', '100%']);
    });

    it('are not children, and also work with an array of children', () => {
      const z = zconcat({ halign: 0.5 }, [el('a'), el('b')]);
      expect(kids(z).map(d => d.id)).toEqual(['a', 'b']);
    });

    it('do not pick up floating-point noise', () => {
      const [a] = kids(zconcat({ halign: 0.1, valign: 0.7 }, el('a')));
      expect([a.style.left, a.style.top]).toEqual(['10%', '70%']);
    });

    it('of 0 add no offsets', () => {
      const [a] = kids(zconcat({ halign: 0, valign: 0 }, el('a')));
      expect(a.style.position).toBe('');
    });
  });

  it('accepts an array of children, like hconcat and vconcat', () => {
    const items = [el('a'), el('b')];
    for (const layout of [hconcat, vconcat, zconcat]) {
      expect(kids(layout(items)).map(d => d.id)).toEqual(['a', 'b']);
    }
  });

  it('returns an element that exposes itself as its value', () => {
    // (`value` is attached by the layout functions, not part of the DOM types)
    const z = /** @type {any} */ (zconcat(el('a')));
    expect(z.value.element).toBe(z);
  });

  it('can be nested in the other layouts', () => {
    const inner = zconcat(el('a'), el('b'));
    const outer = vconcat(inner, hconcat(inner.cloneNode(true)));
    expect(outer.children[0]).toBe(inner);
    expect(inner.children.length).toBe(2);
  });

  it('leaves the other layouts alone', () => {
    expect(hconcat(el('a')).style.display).toBe('flex');
    expect(vconcat(el('a')).style.flexDirection).toBe('column');
    expect(kids(hconcat(el('a')))[0].style.gridArea).toBe('');
  });
});
