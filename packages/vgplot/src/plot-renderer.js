import * as Plot from '@observablehq/plot';
import { Fixed } from './symbols.js';

const ATTRIBUTE_MAP = new Map([
  ['style', 'style'],
  ['width', 'width'],
  ['height', 'height'],
  ['margin', 'margin'],
  ['marginTop', 'marginTop'],
  ['marginBottom', 'marginBottom'],
  ['marginLeft', 'marginLeft'],
  ['marginRight', 'marginRight'],
  ['inset', 'inset'],
  ['aspectRatio', 'aspectRatio'],
  ['scaleX', 'x.type'],
  ['scaleY', 'y.type'],
  ['domainX', 'x.domain'],
  ['domainY', 'y.domain'],
  ['domainFX', 'fx.domain'],
  ['domainFY', 'fy.domain'],
  ['axisX', 'x.axis'],
  ['axisY', 'y.axis'],
  ['axisLineX', 'x.line'],
  ['axisLineY', 'y.line'],
  ['insetX', 'x.inset'],
  ['insetY', 'y.inset'],
  ['insetLeftX', 'x.insetLeft'],
  ['insetRightX', 'x.insetRight'],
  ['insetTopY', 'y.insetTop'],
  ['insetBottomY', 'y.insetBottom'],
  ['roundX', 'x.round'],
  ['roundY', 'y.round'],
  ['grid', 'grid'],
  ['gridX', 'x.grid'],
  ['gridY', 'y.grid'],
  ['niceX', 'x.nice'],
  ['niceY', 'y.nice'],
  ['zeroX', 'x.zero'],
  ['zeroY', 'y.zero'],
  ['reverseX', 'x.reverse'],
  ['reverseY', 'y.reverse'],
  ['ticksX', 'x.ticks'],
  ['ticksY', 'y.ticks'],
  ['tickFormatX', 'x.tickFormat'],
  ['tickFormatY', 'y.tickFormat'],
  ['tickFormatFX', 'fx.tickFormat'],
  ['tickFormatFY', 'fy.tickFormat'],
  ['tickFormatColor', 'color.tickFormat'],
  ['tickRotateX', 'x.tickRotate'],
  ['tickRotateY', 'y.tickRotate'],
  ['tickSizeX', 'x.tickSize'],
  ['tickSizeY', 'y.tickSize'],
  ['labelX', 'x.label'],
  ['labelY', 'y.label'],
  ['labelAnchorX', 'x.labelAnchor'],
  ['labelAnchorY', 'y.labelAnchor'],
  ['labelOffsetX', 'x.labelOffset'],
  ['labelOffsetY', 'y.labelOffset'],
  ['scaleColor', 'color.type'],
  ['domainColor', 'color.domain'],
  ['rangeColor', 'color.range'],
  ['schemeColor', 'color.scheme'],
  ['interpolateColor', 'color.interpolate'],
  ['zeroColor', 'color.zero'],
  ['labelColor', 'color.label'],
  ['scaleOpacity', 'opacity.type'],
  ['domainOpacity', 'opacity.domain'],
  ['rangeOpacity', 'opacity.range'],
  ['zeroOpacity', 'opacity.zero'],
  ['labelOpacity', 'opacity.label'],
  ['scaleR', 'r.scale'],
  ['domainR', 'r.domain'],
  ['rangeR', 'r.range'],
  ['zeroR', 'r.zero'],
  ['scaleLength', 'length.type'],
  ['domainLength', 'length.domain'],
  ['rangeLength', 'length.range'],
  ['zeroLength', 'length.zero'],
  ['labelFX', 'fx.label'],
  ['labelFY', 'fy.label'],
  ['reverseFX', 'fx.reverse'],
  ['reverseFY', 'fy.reverse'],
  ['marginTopFacet', 'facet.marginTop'],
  ['marginRightFacet', 'facet.marginRight'],
  ['marginBottomFacet', 'facet.marginBottom'],
  ['marginLeftFacet', 'facet.marginLeft'],
  ['gridFacet', 'facet.grid'],
  ['labelFacet', 'facet.label'],
  ['projectionType', 'projection.type'],
  ['projectionParallels', 'projection.parallels'],
  ['projectionPrecision', 'projection.precision'],
  ['projectionRotate', 'projection.rotate'],
  ['projectionDomain', 'projection.domain'],
  ['projectionInset', 'projection.inset'],
  ['projectionInsetLeft', 'projection.insetLeft'],
  ['projectionInsetRight', 'projection.insetRight'],
  ['projectionInsetTop', 'projection.insetTop'],
  ['projectionInsetBottom', 'projection.insetBottom'],
  ['projectionClip', 'projection.clip']
]);

const OPTIONS_ONLY_MARKS = new Set([
  'frame',
  'hexgrid',
  'sphere',
  'graticule'
])

function setProperty(object, path, value) {
  for (let i = 0; i < path.length; ++i) {
    const key = path[i];
    if (i === path.length - 1) {
      object[key] = value;
    } else {
      object = (object[key] || (object[key] = {}));
    }
  }
}

// construct Plot output
// see https://github.com/observablehq/plot
export async function plotRenderer(plot) {
  const spec = { marks: [] };
  const symbols = [];

  const { attributes, marks } = plot;

  // populate top-level and scale properties
  for (const key in attributes) {
    const specKey = ATTRIBUTE_MAP.get(key);
    if (specKey == null) {
      throw new Error(`Unrecognized plot attribute: ${key}`);
    }
    const value = attributes[key];
    if (typeof value === 'symbol') {
      symbols.push(key);
    } else if (value !== undefined) {
      setProperty(spec, specKey.split('.'), value);
    }
  }

  // populate marks
  const indices = [];
  for (const mark of marks) {
    for (const { type, data, options } of mark.plotSpecs()) {
      if (OPTIONS_ONLY_MARKS.has(type)) {
        spec.marks.push(Plot[type](options));
      } else {
        spec.marks.push(Plot[type](data, options));
      }
      indices.push(mark.index);
    }
  }

  // infer labels
  inferLabels(spec, plot);

  // render plot
  const svg = Plot.plot(spec);

  // annotate svg with mark indices
  annotatePlot(svg, indices);

  // set symbol-valued attributes, such as fixed domains
  setSymbolAttributes(plot, svg, attributes, symbols);

  // initialize interactors
  for (const interactor of plot.interactors) {
    await interactor.init(svg);
  }

  return svg;
}

function setSymbolAttributes(plot, svg, attributes, symbols) {
  symbols.forEach(key => {
    const value = attributes[key];
    if (value === Fixed) {
      if (!key.startsWith('domain')) {
        throw new Error(`Unsupported fixed attribute: ${key}`);
      }
      const type = key.slice('domain'.length);
      const scale = svg.scale(type.toLowerCase());
      if (scale?.domain) {
        plot.setAttribute(key, attributes[`reverse${type}`]
          ? scale.domain.slice().reverse()
          : scale.domain);
      }
    } else {
      throw new Error(`Unrecognized symbol: ${value}`);
    }
  });
}

function inferLabels(spec, plot) {
  const { marks } = plot;
  inferLabel('x', spec, marks, ['x', 'x1', 'x2']);
  inferLabel('y', spec, marks, ['y', 'y1', 'y2']);
  inferLabel('fx', spec, marks);
  inferLabel('fy', spec, marks);
}

function inferLabel(key, spec, marks, channels = [key]) {
  const scale = spec[key] || {};
  if (scale.axis === null || scale.label !== undefined) return; // nothing to do

  const fields = marks.map(mark => mark.channelField(channels));
  if (fields.every(x => x == null)) return; // no columns found

  // check for consistent columns / labels
  let candCol;
  let candLabel;
  let type;
  for (let i = 0; i < fields.length; ++i) {
    const { column, label } = fields[i] || {};
    if (column === undefined && label === undefined) {
      continue;
    } else if (candCol === undefined && candLabel === undefined) {
      candCol = column;
      candLabel = label;
      type = getType(marks[i].data, channels) || 'number';
    } else if (candLabel !== label) {
      candLabel = undefined;
    } else if (candCol !== column) {
      candCol = undefined;
    }
  }
  let candidate = candLabel || candCol;
  if (candidate === undefined) return;

  // adjust candidate label formatting
  if ((type === 'number' || type === 'date') && (key === 'x' || key === 'y')) {
    if (scale.percent) candidate = `${candidate} (%)`;
    const order = (key === 'x' ? 1 : -1) * (scale.reverse ? -1 : 1);
    if (key === 'x' || scale.labelAnchor === 'center') {
      candidate = (key === 'x') === order < 0 ? `← ${candidate}` : `${candidate} →`;
    } else {
      candidate = `${order < 0 ? '↑ ' : '↓ '}${candidate}`;
    }
  }

  // add label to spec
  spec[key] = { ...scale, label: candidate };
}

function annotatePlot(svg, indices) {
  const facets = svg.querySelectorAll('g[aria-label="facet"]');
  if (facets.length) {
    for (const facet of facets) {
      annotateMarks(facet, indices);
    }
  } else {
    annotateMarks(svg, indices);
  }
}

function annotateMarks(svg, indices) {
  let index = -1;
  for (const child of svg.children) {
    const aria = child.getAttribute('aria-label') || '';
    const skip = child.nodeName === 'style'
      || aria.includes('-axis')
      || aria.includes('-grid');
    if (!skip) {
      child.setAttribute('data-index', indices[++index]);
    }
  }
}

function getType(data, channels) {
  for (const row of data) {
    for (let j = 0; j < channels.length; ++j) {
      const v = row[channels[j]];
      if (v != null) {
        return v instanceof Date ? 'date' : typeof v;
      }
    }
  }
}
