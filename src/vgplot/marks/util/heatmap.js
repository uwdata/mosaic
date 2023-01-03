import { rgb } from 'd3';

export function heatmap({
  grid,
  w,
  h,
  canvas = createCanvas(w, h),
  clamp = [min(grid, 0), max(grid, 0)],
  scheme = palette(256, opacityMap())
}) {
  const [lo, hi] = clamp;
  const norm = 1 / (hi - lo);
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const pix = img.data;
  const n = (scheme.length >> 2) - 1;

  for (let j = 0, k = 0; j < h; ++j) {
    for (let i = 0, row = (h - j - 1) * w; i < w; ++i, k += 4) {
      const v = Math.min(1, Math.max(grid[i + row] - lo, 0) * norm);
      const c = (n * v) << 2;
      pix[k + 0] = scheme[c + 0];
      pix[k + 1] = scheme[c + 1];
      pix[k + 2] = scheme[c + 2];
      pix[k + 3] = scheme[c + 3];
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
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
    // eslint-disable-next-line no-undef
    const c = document.createElement('canvas');
    c.setAttribute('width', w);
    c.setAttribute('height', h);
    return c;
  }
  throw 'Can not create a canvas instance, provide a canvas as a parameter.';
}

function max(array, v) {
  const n = array.length;
  for (let i = 0; i < n; ++i) {
    if (array[i] > v) v = array[i];
  }
  return v;
}

function min(array, v) {
  const n = array.length;
  for (let i = 0; i < n; ++i) {
    if (array[i] < v) v = array[i];
  }
  return v;
}

export function opacityMap(color = 'black') {
  const { r, g, b } = rgb(color);
  return opacity => ({ r, g, b, opacity });
}
