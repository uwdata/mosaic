// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { menu } from '../src/Menu.js';
import { Table } from '../src/Table.js';

describe('input', () => {
  it('passes options to the input constructor', () => {
    const element = document.createElement('div');
    const el = menu({ element, options: ['a', 'b'] });
    expect(el).toBe(element);
    expect(el.querySelectorAll('option')).toHaveLength(2);
  });

  it('keeps the class of a caller-supplied table element', () => {
    const element = document.createElement('div');
    element.className = 'custom';
    new Table({ element });
    expect(element.className).toBe('custom');
  });
});
