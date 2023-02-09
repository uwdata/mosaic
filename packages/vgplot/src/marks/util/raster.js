import { rgb } from 'd3';

export function raster(grid, data, w, h, scale, scheme) {
  const n = (scheme.length >> 2) - 1;
  for (let j = 0, k = 0; j < h; ++j) {
    for (let i = 0, row = (h - j - 1) * w; i < w; ++i, k += 4) {
      const c = (n * scale(grid[i + row])) << 2;
      data[k + 0] = scheme[c + 0];
      data[k + 1] = scheme[c + 1];
      data[k + 2] = scheme[c + 2];
      data[k + 3] = scheme[c + 3];
    }
  }
}

export function palette(size, interp) {
  const p = new Uint8ClampedArray(4 * size);
  const n = size - 1;
  for (let i = 0; i <= n; ++i) {
    const v = interp(i / n);
    const { r, g, b, opacity = 1 } = typeof v === 'string' ? rgb(v) : v;
    const k = i << 2;
    p[k + 0] = r;
    p[k + 1] = g;
    p[k + 2] = b;
    p[k + 3] = (255 * opacity) | 0;
  }
  return p;
}

export function createCanvas(w, h) {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.setAttribute('width', w);
    c.setAttribute('height', h);
    return c;
  }
  throw new Error('Can not create a canvas instance.');
}

export function opacityMap(color = 'black') {
  const { r, g, b } = rgb(color);
  return opacity => ({ r, g, b, opacity });
}
