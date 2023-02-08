import * as Plot from '@observablehq/plot';
import { Fixed } from './symbols.js';

const ATTRIBUTE_MAP = new Map([
  ['width', 'width'],
  ['height', 'height'],
  ['margin', 'margin'],
  ['marginTop', 'marginTop'],
  ['marginBottom', 'marginBottom'],
  ['marginLeft', 'marginLeft'],
  ['marginRight', 'marginRight'],
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
  ['domainR', 'r.domain'],
  ['rangeR', 'r.range'],
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
]);

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
// TOP-LEVEL
//  width, height, margin(top/right/bottom/left)
//  caption, style, className, document
// SCALES
//  KEYS: x, y, r, color, opacity, length (vectors), symbol (dots)
//  FIELDS: type, domain, range, unknown, reverse, interval, transform
//  QUANT: clamp, nice, zero, percent
//  XY: inset, round, inset(top/bottom/left/right)
//  ORDINAL: padding, align, padding(inner/outer)
//  AXIS: ...
//  COLOR: ..., scheme, interpolate
//  SORT: (manual or use a mark.sort option)
//  FACET: data, x, y, margin(...), grid, label
//   MARK: auto, include, exclude, null
// MARKS
//  TYPES
//    areaX/Y: x1, y1, x2, y2, z
//    barX/Y: x, y, x1, y1, x2, y2
//    rectX/Y: x, y, x1, y1, x2, y2
//    dot, circle, hexagon: x, y, r, rotate, symbol, frameAnchor
//    lineX/Y: x, y, z
//    ruleX/Y
//  STYLES: fill, fillOpacity, stroke, strokeWidth
//    strokeOpacity, strokeLinejoin, strokeLinecap, strokeMiterlimit
//    strokeDasharray, strokeDashoffset
//    opacity, mixBlendMode, shapeRendering, paintOrder
//    dx, dy
//    target, ariaDescription, ariaHidden, pointerEvents, clip
//  CHANNELS: fill, fillOpacity, stroke, strokeOpacity, strokeWidth
//    opacity, title, href, ariaLabel
//  RECTS: inset(...), rx, ry (rounded corners)
//    frameAnchor
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
      if (type === 'frame' || type === 'hexgrid') {
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

  // set fixed entries
  symbols.forEach(key => {
    const value = attributes[key];
    if (value === Fixed) {
      let scale;
      switch (key) {
        case 'domainX': scale = 'x'; break;
        case 'domainY': scale = 'y'; break;
        case 'domainFX': scale = 'fx'; break;
        case 'domainFY': scale = 'fy'; break;
        case 'domainColor': scale = 'color'; break;
        case 'domainR': scale = 'r'; break;
        default:
          throw new Error(`Unsupported fixed attribute: ${key}`);
      }
      const domain = svg.scale(scale)?.domain;
      if (domain) {
        plot.setAttribute(key, domain);
      }
    } else {
      throw new Error(`Unrecognized symbol: ${value}`);
    }
  });

  // initialize interactive selections
  for (const sel of plot.selections) {
    await sel.init(svg);
  }

  return svg;
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
    const skip = child.nodeName === 'style' ||
      (child.getAttribute('aria-label') || '').endsWith('-axis');
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
