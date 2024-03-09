import { ascending } from 'd3';
import { scale } from '@observablehq/plot';
import { gridDomainContinuous, gridDomainDiscrete } from './util/grid.js';
import { isColor } from './util/is-color.js';
import { alphaScheme, alphaConstant, colorConstant, colorCategory, colorScheme, createCanvas } from './util/raster.js';
import { DENSITY, Grid2DMark } from './Grid2DMark.js';
import { Fixed, Transient } from '../symbols.js';

/**
 * Raster image mark. Data is binned to a grid based on the x and y options.
 * The grid cells are then colored to form an image.
 * The raster grid size defaults to the pixel width/height of the
 * plot. The pixelSize option (default 1) changes the grid cell to pixel
 * ratio. For example, a pixelSize of 0.5 will create a larger raster
 * for higher resolution images on retina displays. The width and height
 * options set the grid dimensions directly, overriding other options.
 * The raster grid can optionally be smoothed (blurred) by setting
 * the bandwidth option.
 */
export class RasterMark extends Grid2DMark {
  constructor(source, options) {
    super('image', source, options);
  }

  setPlot(plot, index) {
    const update = () => { if (this.hasFieldInfo()) this.rasterize(); };
    plot.addAttributeListener('schemeColor', update);
    super.setPlot(plot, index);
  }

  convolve() {
    return super.convolve().rasterize();
  }

  rasterize() {
    const { bins, kde } = this;
    const [ w, h ] = bins;

    // raster data
    const { canvas, ctx, img } = imageData(this, w, h);

    // color + opacity encodings
    const { alpha, alphaProp, color, colorProp } = rasterEncoding(this);

    // generate rasters
    this.data = kde.map(cell => {
      color?.(img.data, w, h, cell[colorProp]);
      alpha?.(img.data, w, h, cell[alphaProp]);
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
      imageRendering: this.channel('imageRendering')?.value,
      frameAnchor: 'middle'
    };
    return [{ type, data, options }];
  }
}

/**
 * Density heatmap image.
 * This is just a raster mark with default options for
 * accurate binning and smoothing for density estimation.
 */
export class HeatmapMark extends RasterMark {
  constructor(source, options) {
    super(source, {
      bandwidth: 20,
      interpolate: 'linear',
      pixelSize: 2,
      ...options
    });
  }
}

/**
 * Utility method to generate color and alpha encoding helpers.
 * The returned methods can write directly to a pixel raster.
 */
export function rasterEncoding(mark) {
  const { aggr, densityMap, groupby, plot } = mark;
  const hasDensity = aggr.includes(DENSITY);
  const hasFillOpacity = aggr.includes('fillOpacity');
  const fillEntry = mark.channel('fill');
  const opacEntry = mark.channel('fillOpacity');

  // check constraints, raise errors
  if (aggr.length > 2 || (hasDensity && hasFillOpacity)) {
    throw new Error('Invalid raster encodings. Try dropping an aggregate?');
  }
  if (groupby.includes(opacEntry?.as)) {
    throw new Error('Raster fillOpacity must be an aggregate or constant.');
  }

  // determine fill encoding channel use
  const fill = densityMap.fill || aggr.includes('fill') ? 'grid'
    : groupby.includes(fillEntry?.as) ? 'group' // groupby
    : isColor(fillEntry?.value) ? fillEntry.value // constant
    : hasDensity && plot.getAttribute('colorScheme') ? 'grid'
    : undefined;

  // determine fill opacity encoding channel use
  const opac = densityMap.fillOpacity || aggr.includes('fillOpacity') ? 'grid'
    : typeof opacEntry?.value === 'number' ? opacEntry.value // constant
    : hasDensity && fill !== 'grid' ? 'grid'
    : undefined;

  if (fill !== 'grid' && opac !== 'grid') {
    // TODO: use a threshold-based encoding?
    throw new Error('Raster mark missing density values.');
  }

  const colorProp = fillEntry?.as ?? (fill === 'grid' ? DENSITY : null);
  const alphaProp = opacEntry?.as ?? (opac === 'grid' ? DENSITY : null);
  const color = fill !== 'grid' && fill !== 'group'
    ? colorConstant(fill)
    : colorScale(mark, colorProp);
  const alpha = opac !== 'grid'
    ? alphaConstant(opac)
    : alphaScale(mark, alphaProp);

  return { alphaProp, colorProp, alpha, color };
}

function alphaScale(mark, prop) {
  const { plot, kde: grids } = mark;

  // determine scale domain
  const domainAttr = plot.getAttribute('opacityDomain');
  const domainFixed = domainAttr === Fixed;
  const domainTransient = domainAttr?.[Transient];
  const domain = (!domainFixed && !domainTransient && domainAttr)
    || gridDomainContinuous(grids, prop);
  if (domainFixed || domainTransient) {
    if (domainTransient) domain[Transient] = true;
    plot.setAttribute('colorDomain', domain);
  }

  // generate opacity scale
  const s = scale({
    opacity: {
      type: plot.getAttribute('opacityScale'),
      domain,
      clamp: plot.getAttribute('opacityClamp'),
      nice: plot.getAttribute('opacityNice'),
      reverse: plot.getAttribute('opacityReverse'),
      zero: plot.getAttribute('opacityZero'),
      base: plot.getAttribute('opacityBase'),
      exponent: plot.getAttribute('opacityExponent'),
      constant: plot.getAttribute('opacityConstant')
    }
  });
  return alphaScheme(s);
}

function colorScale(mark, prop) {
  const { plot, kde: grids } = mark;
  const flat = !grids[0][prop]?.map; // not array-like
  const discrete = flat || Array.isArray(grids[0][prop]);

  // determine scale domain
  const domainAttr = plot.getAttribute('colorDomain');
  const domainFixed = domainAttr === Fixed;
  const domainTransient = domainAttr?.[Transient];
  const domain = (!domainFixed && !domainTransient && domainAttr) || (
    flat ? grids.map(cell => cell[prop]).sort(ascending)
      : discrete ? gridDomainDiscrete(grids, prop)
      : gridDomainContinuous(grids, prop)
  );
  if (domainFixed || domainTransient) {
    if (domainTransient) domain[Transient] = true;
    plot.setAttribute('colorDomain', domain);
  }

  // generate color scale
  const s = scale({
    color: {
      type: plot.getAttribute('colorScale'),
      domain,
      range: plot.getAttribute('colorRange'),
      clamp: plot.getAttribute('colorClamp'),
      n: plot.getAttribute('colorN'),
      nice: plot.getAttribute('colorNice'),
      reverse: plot.getAttribute('colorReverse'),
      scheme: plot.getAttribute('colorScheme'),
      interpolate: plot.getAttribute('colorInterpolate'),
      pivot: plot.getAttribute('colorPivot'),
      symmetric: plot.getAttribute('colorSymmetric'),
      zero: plot.getAttribute('colorZero'),
      base: plot.getAttribute('colorBase'),
      exponent: plot.getAttribute('colorExponent'),
      constant: plot.getAttribute('colorConstant')
    }
  });

  // TODO: add support for threshold scales?
  if (discrete) {
    return colorCategory(s);
  } else {
    // Plot scales do not expose intermediate transformation of
    // values to [0, 1] fractions. So we hobble together our own.
    const frac = scale({
      x: {
        type: inferScaleType(s.type),
        domain: s.domain,
        reverse: s.reverse,
        range: [0, 1],
        clamp: s.clamp,
        base: s.base,
        exponent: s.exponent,
        constant: s.constant
      }
    });
    return colorScheme(1024, s, frac.apply);
  }
}

function inferScaleType(type) {
  if (type.endsWith('symlog')) return 'symlog';
  if (type.endsWith('log')) return 'log';
  if (type.endsWith('pow')) return 'pow';
  if (type.endsWith('sqrt')) return 'sqrt';
  if (type === 'diverging') return 'linear';
  return type;
}

export function imageData(mark, w, h) {
  if (!mark.image || mark.image.w !== w || mark.image.h !== h) {
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, w, h);
    mark.image = { canvas, ctx, img, w, h };
  }
  return mark.image;
}
