import { Toggle } from './interactors/Toggle.js';

export class Legend {
  constructor(channel, options) {
    const { as, ...rest } = options;
    this.channel = channel;
    this.options = { label: null, ...rest };
    this.selection = as;

    this.element = document.createElement('div');
    this.element.setAttribute('class', 'legend');
    this.element.value = this;
  }

  setPlot(plot) {
    const { channel, selection } = this;
    const mark = findMark(plot, channel);
    if (this.selection && mark) {
      this.handler = new Toggle(mark, { selection, channels: [channel] });
      this.selection.addEventListener('value', () => this.update());
    }
  }

  init(svg) {
    const { channel, options, handler } = this;
    const scale = svg.scale(channel);
    const opt = scale.type === 'ordinal'
      ? options
      : { marginTop: 1, tickSize: 2, height: 28, ...options };
    this.legend = svg.legend(channel, opt);

    if (handler) {
      handler.init(this.legend, ':scope > div', el => [el.__data__]);
      this.update();
    }

    this.element.replaceChildren(this.legend);
    return this.element;
  }

  update() {
    if (!this.legend) return;
    const { value } = this.selection;
    const curr = value && value.length ? new Set(value.map(v => v[0])) : null;
    const nodes = this.legend.querySelectorAll(':scope > div');
    for (const node of nodes) {
      const selected = curr ? curr.has(node.__data__) : true;
      node.style.opacity = selected ? 1 : 0.2;
    }
  }
}

function findMark({ marks }, channel) {
  const channels = channel === 'color' ? ['fill', 'stroke']
    : channel === 'opacity' ? ['opacity', 'fillOpacity', 'strokeOpacity']
    : null;
  if (channels == null) return null;
  for (let i = marks.length - 1; i > -1; --i) {
    if (marks[i].channelField(channels)) {
      return marks[i];
    }
  }
  return null;
}
