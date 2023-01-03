import { scale } from '@observablehq/plot';
import { isColor } from './util/is-color.js';
import { createCanvas, opacityMap, heatmap, palette } from './util/heatmap.js';
import { Density2DMark } from './Density2DMark.js';

export class HeatmapMark extends Density2DMark {
  constructor(source, options) {
    super('image', source, options);
  }

  convolve() {
    super.convolve();
    const { bins, kde, groupby } = this;
    const [ w, h ] = bins;
    const canvas = this.canvas || (this.canvas = createCanvas(w, h));

    // compute kde grid extents
    let lo = 0;
    let hi = 0;
    kde.forEach(grid => {
      const n = grid.length;
      for (let i = 0; i < n; ++i) {
        const v = grid[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    });
    const clamp = [lo, hi];

    // gather color domain if needed
    const idx = groupby.indexOf('fill');
    const domain = idx < 0 ? [] : kde.map(({ key }) => key[idx]);

    // generate heatmap images
    this.src = kde.map(grid => {
      const scheme = createScheme(this, domain, grid.key?.[idx]);
      const src = heatmap({ grid, w, h, canvas, clamp, scheme }).toDataURL();
      return { src };
    });

    return this;
  }

  plotSpecs() {
    const { type, plot, src } = this;
    const options = {
      src: 'src',
      width: plot.innerWidth(),
      height: plot.innerHeight(),
      preserveAspectRatio: 'none',
      frameAnchor: 'middle'
    };
    return [{ type, data: src, options }];
  }
}

function createScheme(mark, domain, value) {
  const { densityFill, groupby, plot } = mark;
  const scheme = plot.getAttribute('schemeColor');
  const fill = mark.channels.find(c => c.channel === 'fill');
  let interp;

  if (densityFill) {
    // fill is based on computed densities
    if (scheme) {
      try {
        interp = scale({color: { scheme, domain: [0, 1] }}).interpolate;
      } catch (err) {
        console.warn(err);
      }
    } else {
      interp = opacityMap();
    }
  } else if (domain.length) {
    // fill is based on data values
    const color = scale({color: { scheme: (scheme || 'tableau10'), domain }});
    interp = opacityMap(color.apply(value));
  } else if (isColor(fill?.value)) {
    // fill color is a constant
    interp = opacityMap(fill.value);
  }

  return palette(512, interp);
}
