import { describe, it, expect } from 'vitest';
import { Coordinator, coordinator } from '../src/index.js';

describe('coordinator', () => {
  it('has accessible singleton', () => {
    const mc = coordinator();
    expect(mc).toBeInstanceOf(Coordinator);

    const mc2 = new Coordinator();
    coordinator(mc2);

    expect(coordinator()).toBe(mc2);
  });
});
