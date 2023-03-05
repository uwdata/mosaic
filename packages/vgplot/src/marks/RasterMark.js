import { scale } from '@observablehq/plot';
import { isColor } from './util/is-color.js';
import { createCanvas, raster, opacityMap, palette } from './util/raster.js';
import { Density2DMark } from './Density2DMark.js';

export class RasterMark extends Density2DMark {
  constructor(source, options) {
    super('image', source, options);
  }

  setPlot(plot, index) {
    const update = () => { if (this.stats) this.rasterize(); };
    plot.addAttributeListener('schemeColor', update);
    super.setPlot(plot, index);
  }

  convolve() {
    return super.convolve().rasterize();
  }

  rasterize() {
    const { bins, kde, groupby } = this;
    const [ w, h ] = bins;

    // raster data
    const { canvas, ctx, img } = imageData(this, w, h);

    // scale function to map densities to [0, 1]
    const s = imageScale(this);

    // gather color domain as needed
    const idx = groupby.indexOf('fill');
    const domain = idx < 0 ? [] : kde.map(({ key }) => key[idx]);

    // generate raster images
    this.data = kde.map(grid => {
      const palette = imagePalette(this, domain, grid.key?.[idx]);
      raster(grid, img.data, w, h, s, palette);
      ctx.putImageData(img, 0, 0);
      return { src: canvas.toDataURL() };
    });

    return this;
  }

  plotSpecs() {
    const { type, plot, data } = this;
    const options = {
      src: 'src',
      width: plot.innerWidth(),
      height: plot.innerHeight(),
      preserveAspectRatio: 'none',
      frameAnchor: 'middle'
    };
    return [{ type, data, options }];
  }
}

function imageData(mark, w, h) {
  if (!mark.image || mark.image.w !== w || mark.image.h !== h) {
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, w, h);
    mark.image = { canvas, ctx, img, w, h };
  }
  return mark.image;
}

function imageScale(mark) {
  const { densityFill, kde, plot } = mark;
  let domain = densityFill && plot.getAttribute('domainColor');

  // compute kde grid extents if no explicit domain
  if (!domain) {
    let lo = 0, hi = 0;
    kde.forEach(grid => {
      for (const v of grid) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    });
    domain = (lo === 0 && hi === 0) ? [0, 1] : [lo, hi];
  }

  const type = plot.getAttribute('scaleColor');
  return scale({ x: { type, domain, range: [0, 1] } }).apply;
}

function imagePalette(mark, domain, value, steps = 1024) {
  const { densityFill, plot } = mark;
  const scheme = plot.getAttribute('schemeColor');
  let color;

  if (densityFill) {
    if (scheme) {
      try {
        return palette(
          steps,
          scale({color: { scheme, domain: [0, 1] }}).interpolate
        );
      } catch (err) {
        console.warn(err);
      }
    }
  } else if (domain.length) {
    // fill is based on data values
    const s = scheme || 'tableau10';
    color = scale({ color: { scheme: s, domain } }).apply(value);
  } else {
    // fill color is a constant
    const fill = mark.channels.find(c => c.channel === 'fill');
    color = isColor(fill?.value) ? fill.value : undefined;
  }

  return palette(steps, opacityMap(color));
}
