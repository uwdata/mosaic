import type { Scale } from '@observablehq/plot';

export function invert(value: number, scale: Scale, pixelSize: number = 1): number {
  return scale.invert(pixelSize * Math.floor(value / pixelSize));
}
