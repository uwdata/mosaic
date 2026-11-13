import { expect, describe, it } from 'vitest';
import { Coordinator, coordinator } from '@uwdata/mosaic-core';
import { createAPIContext } from '../src/index.js';

describe('createAPIContext', () => {
  it('api.coordinator() returns the context-scoped coordinator, not the global one', () => {
    const mc = new Coordinator();
    const api = createAPIContext({ coordinator: mc });

    expect(api.coordinator()).toBe(mc);
    expect(api.coordinator()).not.toBe(coordinator());
  });

  it('api.coordinator() matches api.context.coordinator, defaulting to the global coordinator', () => {
    const api = createAPIContext();

    expect(api.coordinator()).toBe(coordinator());
    expect(api.coordinator()).toBe(api.context.coordinator);
  });
});
