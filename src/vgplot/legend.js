import { PointSelection } from './selections/Point.js';

export class Legend {
  constructor(plot, channel, options) {
    const { as, ...rest } = options;
    this.mark = findMark(plot, channel);
    this.channel = channel;
    this.options = rest;
    this.selection = as;

    if (this.selection && this.mark) {
      this.handler = new PointSelection(this.mark, {
        selection: this.selection,
        channels: [channel]
      });
      this.selection.addEventListener('value', () => this.update());
    }
  }

  init(svg) {
    const { channel, options, handler } = this;
    this.legend = svg.legend(channel, options);

    if (handler) {
      handler.init(this.legend, ':scope > div', el => [el.__data__]);
      this.update();
    }

    return this.legend;
  }

  update() {
    if (!this.legend) return;
    const { value } = this.selection;
    const curr = value ? new Set(value.map(v => v[0])) : null;
    const nodes = this.legend.querySelectorAll(':scope > div');
    for (const node of nodes) {
      const selected = curr == null || curr.has(node.__data__);
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
