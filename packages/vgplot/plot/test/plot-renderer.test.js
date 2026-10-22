import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dot: vi.fn(),
  plot: vi.fn(() => ({ children: [] })),
  pointerY: vi.fn(options => ({ ...options, pointerY: true }))
}));

vi.mock('@observablehq/plot', () => ({
  ...mocks,
  pointer: vi.fn(),
  pointerX: vi.fn(),
  selectFirst: vi.fn(),
  selectLast: vi.fn(),
  selectMaxX: vi.fn(),
  selectMaxY: vi.fn(),
  selectMinX: vi.fn(),
  selectMinY: vi.fn()
}));

const { plotRenderer } = await import('../src/plot-renderer.js');

describe('plotRenderer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies pointerY for nearestY mark selection', async () => {
    const data = [{ x: 0, y: 1 }];
    const options = { x: 'x', y: 'y', select: 'nearestY' };
    const mark = {
      index: -1,
      channelField: () => undefined,
      plotSpecs: () => [{ type: 'dot', data, options }]
    };

    await plotRenderer({ attributes: {}, marks: [mark], interactors: [] });

    expect(mocks.pointerY).toHaveBeenCalledWith({ x: 'x', y: 'y' });
    expect(mocks.dot).toHaveBeenCalledWith(data, {
      x: 'x', y: 'y', pointerY: true
    });
  });
});
