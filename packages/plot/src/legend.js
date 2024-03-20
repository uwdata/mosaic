import { scale } from '@observablehq/plot';
import { Interval1D } from './interactors/Interval1D.js';
import { Toggle } from './interactors/Toggle.js';

const TOGGLE_SELECTOR = ':scope > div, :scope > span';
const SWATCH = 'swatch';
const RAMP = 'ramp';

export class Legend {
  constructor(channel, options) {
    const { as, field, ...rest } = options;
    this.channel = channel;
    this.options = { label: null, ...rest };
    this.type = null;
    this.handler = null;
    this.selection = as;
    this.field = field;

    this.element = document.createElement('div');
    this.element.setAttribute('class', 'legend');
    this.element.value = this;
  }

  setPlot(plot) {
    this.plot = plot;
  }

  init(svg) {
    // createLegend sets this.legend, may set this.handler
    const el = createLegend(this, svg);
    this.element.replaceChildren(el);
    return this.element;
  }

  update() {
    if (!this.legend) return;
    const { value } = this.selection;
    const curr = value && value.length ? new Set(value.map(v => v[0])) : null;
    const nodes = this.legend.querySelectorAll(TOGGLE_SELECTOR);
    for (const node of nodes) {
      const selected = curr ? curr.has(node.__data__) : true;
      node.style.opacity = selected ? 1 : 0.2;
    }
  }
}

function createLegend(legend, svg) {
  const { channel, options, selection } = legend;
  const scale = svg.scale(channel);
  const type = scale.type === 'ordinal' ? SWATCH : RAMP;

  // labels for swatch legends are not yet supported by Plot
  // track here: https://github.com/observablehq/plot/issues/834
  // for consistent layout, adjust sizing when there is no label
  const opt = type === SWATCH ? options
    : options.label ? { tickSize: 2, ...options }
    : { tickSize: 2, marginTop: 1, height: 29, ...options };

  // instantiate new legend element, bind to Legend class
  const el = svg.legend(channel, opt);
  legend.legend = el;

  // if this is an interactive legend, add a scale lookup function
  // this allows interval interactors to access encoding information
  let interactive = !!selection;
  if (interactive && type === RAMP) {
    const width = opt.width ?? 240; // 240 is default ramp length
    const spatial = spatialScale(scale, width);
    if (spatial) {
      el.scale = function(type) {
        return type === 'x' ? { range: [0, width] }
          : type === 'y' ? { range: [-10, 0] }
          : type === channel ? spatial
          : undefined;
      };
    } else {
      // spatial scale construction failed, disable interaction
      interactive = false;
    }
  }

  // initialize interactors to use updated legend element
  if (interactive) {
    const handler = getInteractor(legend, type);
    if (type === SWATCH) {
      handler.init(el, TOGGLE_SELECTOR, el => [el.__data__]);
      legend.update();
    } else {
      handler.init(el, el.querySelector('g:last-of-type'));
    }
  }

  return el;
}

function getInteractor(legend, type) {
  const { channel, handler, selection } = legend;

  // exit early if already instantiated
  if (handler) return handler;

  // otherwise instantiate an appropriate interactor
  const mark = interactorMark(legend);
  if (type === SWATCH) {
    legend.handler = new Toggle(mark, { selection, channels: [channel] });
    selection.addEventListener('value', () => legend.update());
  } else {
    const brush = { fill: 'none', stroke: 'currentColor' };
    legend.handler = new Interval1D(mark, { selection, channel, brush });
  }

  return legend.handler;
}

// generate a faux mark to pass to an interactor
function interactorMark(legend) {
  const { channel, plot } = legend;
  const field = legend.field ?? findField(plot.marks, channel) ?? 'value';
  if (field) {
    const f = { field };
    return { plot, channelField: c => channel === c ? f : undefined };
  }
}

// search marks for a backing data field for the legend
function findField(marks, channel) {
  const channels = channel === 'color' ? ['fill', 'stroke']
    : channel === 'opacity' ? ['opacity', 'fillOpacity', 'strokeOpacity']
    : null;
  if (channels == null) return null;
  for (let i = marks.length - 1; i > -1; --i) {
    for (const c of channels) {
      const field = marks[i].channelField(c, { exact: true });
      if (field) return field.field;
    }
  }
  return null;
}

// generate a spatial scale to brush within color or opacity ramps
function spatialScale(sourceScale, width) {
  // separate out reusable parts of the scale definition
  // eslint-disable-next-line no-unused-vars
  const { apply, invert, interpolate, ...rest } = sourceScale;

  // extract basic source scale type
  let src = sourceScale.type;
  if (src.startsWith('diverging-')) src = src.slice(11);

  // determine spatial scale type
  let type;
  switch (src) {
    case 'log':
    case 'pow':
    case 'sqrt':
    case 'symlog':
      type = src;
      break;
    case 'threshold':
    case 'quantize':
    case 'quantile':
      // these scales do not expose an invert method
      // the legends use color ramps with discrete swatches
      // in the future we could try to support toggle-style
      // interactions that map to threshold range selections
      console.warn(`Legends do not yet support ${src} scales.`);
      return null;
    default:
      type = 'linear';
  }

  return scale({ x: { ...rest, type, range: [0, width] } });
}
