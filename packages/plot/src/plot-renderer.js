import * as Plot from '@observablehq/plot';
import { setAttributes } from './plot-attributes.js';
import { Fixed } from './symbols.js';
import { isArrowTable } from '@uwdata/mosaic-core';

const OPTIONS_ONLY_MARKS = new Set([
  'frame',
  'hexgrid',
  'sphere',
  'graticule'
]);

// construct Plot output
// see https://github.com/observablehq/plot
export async function plotRenderer(plot) {
  const spec = { marks: [] };
  const symbols = [];
  const { attributes, marks } = plot;

  // populate top-level and scale properties
  setAttributes(attributes, spec, symbols);

  // populate marks
  const indices = [];
  for (const mark of marks) {
    for (const { type, data, options } of mark.plotSpecs()) {
      if (OPTIONS_ONLY_MARKS.has(type)) {
        spec.marks.push(Plot[type](options));
      } else if (isArrowTable(data)) {
        // optimized calls to Plot for Arrow:
        // https://github.com/observablehq/plot/issues/191#issuecomment-2010986851
        const opts = Object.fromEntries(
          Object.entries(options).map(([k, v]) => {
            let val = v;
            if (typeof v === 'string') {
              val = data.getChild(v) ?? v;
            } else if (typeof v === 'object') {
              const value = data.getChild(v.value);
              val = value ? {value} : v;
            }
            return [k, val]
          })
        );
        spec.marks.push(Plot[type]({length: data.numRows}, opts));
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
      if (!key.endsWith('Domain')) {
        throw new Error(`Unsupported fixed attribute: ${key}`);
      }
      const type = key.slice(0, -'Domain'.length);
      const scale = svg.scale(type);
      if (scale?.domain) {
        plot.setAttribute(key, attributes[`${type}Reverse`]
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
  inferLabel('x', spec, marks);
  inferLabel('y', spec, marks);
  inferLabel('fx', spec, marks);
  inferLabel('fy', spec, marks);
}

function inferLabel(key, spec, marks) {
  const scale = spec[key] || {};
  if (scale.axis === null || scale.label !== undefined) return; // nothing to do

  const fields = marks.map(mark => mark.channelField(key)?.field);
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
      type = getType(marks[i].data, key) || 'number';
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

function getType(data, channel) {
  const { columns } = data;
  const col = columns[channel] ?? columns[channel+'1'] ?? columns[channel+'2'];
  if (col) {
    for (const v of col) {
      if (v != null) {
        return v instanceof Date ? 'date' : typeof v;
      }
    }
  }
}
