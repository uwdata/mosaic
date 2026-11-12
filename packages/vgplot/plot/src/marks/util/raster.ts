import { rgb, type RGBColor } from 'd3';
import type * as ObPlot from '@observablehq/plot';

export function createCanvas(w: any, h: any): HTMLCanvasElement {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.setAttribute('width', w);
    c.setAttribute('height', h);
    return c;
  }
  throw new Error('Can not create a canvas instance.');
}

export function alphaConstant(v: number = 1) {
  const a = (255 * v) | 0;

  // rasterize
  return (data: number[], w: number, h: number) => {
    for (let j = 0, k = 0; j < h; ++j) {
      for (let i = 0; i < w; ++i, k += 4) {
        data[k + 3] = a;
      }
    }
  };
}

export function alphaScheme(scale: ObPlot.Scale) {
  const { apply } = scale;

  // rasterize
  return (data: number[], w: number, h: number, grid: any[]) => {
    for (let j = 0, k = 0; j < h; ++j) {
      for (let i = 0, row = (h - j - 1) * w; i < w; ++i, k += 4) {
        data[k + 3] = (255 * apply(grid[i + row])) | 0;
      }
    }
  };
}

export function colorConstant(v: string | Partial<RGBColor> = {}): (data: any, w: any, h: any) => void {
  const { r = 0, g = 0, b = 0, opacity = 1 } = typeof v === 'string' ? rgb(v) : v;
  const c = new Uint8ClampedArray([r, g, b, (255 * opacity) | 0]);

  // rasterize
  return (data, w, h) => {
    for (let j = 0, k = 0; j < h; ++j) {
      for (let i = 0; i < w; ++i, k += 4) {
        data[k + 0] = c[0];
        data[k + 1] = c[1];
        data[k + 2] = c[2];
        data[k + 3] = c[3];
      }
    }
  };
}

export function colorCategory(scale: ObPlot.Scale) {
  const { domain, range } = scale;
  if (!(Array.isArray(domain) && Array.isArray(range))) {
    throw new TypeError(`Expected an array but got: ${domain}, ${range}`);
  }
  const idx = Object.create(null);
  const p = new Uint8ClampedArray(4 * domain.length);
  const n = domain.length - 1;
  const m = range.length;

  // build palette and index lookup map
  for (let i = 0; i <= n; ++i) {
    const v = range[i % m];
    const { r, g, b, opacity = 1 } = typeof v === 'string' ? rgb(v) : v;
    const k = i << 2;
    p[k + 0] = r;
    p[k + 1] = g;
    p[k + 2] = b;
    p[k + 3] = (255 * opacity) | 0;
    idx[domain[i]] = k;
  }

  // rasterize
  return (data: number[], w: number, h: number, grid: any) => {
    if (grid.map) {
      // categorical values in grid
      for (let j = 0, k = 0; j < h; ++j) {
        for (let i = 0, row = (h - j - 1) * w; i < w; ++i, k += 4) {
          const c = idx[grid[i + row]];
          data[k + 0] = p[c + 0];
          data[k + 1] = p[c + 1];
          data[k + 2] = p[c + 2];
          data[k + 3] = p[c + 3];
        }
      }
    } else {
      // categorical value for group
      const c = idx[grid];
      for (let j = 0, k = 0; j < h; ++j) {
        for (let i = 0; i < w; ++i, k += 4) {
          data[k + 0] = p[c + 0];
          data[k + 1] = p[c + 1];
          data[k + 2] = p[c + 2];
          data[k + 3] = p[c + 3];
        }
      }
    }
  };
}

export function colorScheme(size: number, scale: ObPlot.Scale, frac: (x: number) => number) {
  const { interpolate } = scale;
  if ((typeof interpolate !== 'function')) {
    throw new TypeError(`Expected a function but got: ${interpolate}`);
  }
  const p = new Uint8ClampedArray(4 * size);
  const n = size - 1;

  // build palette
  for (let i = 0; i <= n; ++i) {
    //@ts-expect-error Expected 2 arguments, but got 1.
    const v = interpolate(i / n);
    const { r, g, b, opacity = 1 } = typeof v === 'string' ? rgb(v) : v;
    const k = i << 2;
    p[k + 0] = r;
    p[k + 1] = g;
    p[k + 2] = b;
    p[k + 3] = (255 * opacity) | 0;
  }

  // rasterize
  return (data: number[], w: number, h: number, grid: any[]) => {
    for (let j = 0, k = 0; j < h; ++j) {
      for (let i = 0, row = (h - j - 1) * w; i < w; ++i, k += 4) {
        const c = (n * frac(grid[i + row])) << 2;
        data[k + 0] = p[c + 0];
        data[k + 1] = p[c + 1];
        data[k + 2] = p[c + 2];
        data[k + 3] = p[c + 3];
      }
    }
  };
}
