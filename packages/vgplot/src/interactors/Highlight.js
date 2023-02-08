import { coordinator, throttle } from '@uwdata/mosaic-core';
import { and } from '@uwdata/mosaic-sql';
import { sanitizeStyles } from './util/sanitize-styles.js';

export class Highlight {
  constructor(mark, {
    selection,
    channels = {}
  }) {
    this.mark = mark;
    this.selection = selection;
    const c = Object.entries(sanitizeStyles(channels));
    this.channels = c.length ? c : [['opacity', 0.2]];
    this.selection.addEventListener('value', throttle(() => this.update()));
  }

  init(svg) {
    this.svg = svg;
    const values = this.values = [];
    const index = this.mark.index;
    const nodes = this.nodes = svg.querySelectorAll(`[data-index="${index}"] > *`);

    const { channels } = this;
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      values.push(channels.map(c => node.getAttribute(c[0])));
    }

    return this.update();
  }

  async update() {
    const { svg, nodes, channels, values, mark, selection } = this;
    if (!svg) return;

    const test = await predicateFunction(mark, selection);

    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      const base = values[i];
      const t = test(node.__data__);
      // TODO? handle inherited values / remove attributes
      for (let j = 0; j < channels.length; ++j) {
        const [attr, value] = channels[j];
        node.setAttribute(attr, t ? base[j] : value);
      }
    }
  }
}

async function predicateFunction(mark, selection) {
  const pred = selection?.predicate(mark);

  if (!pred || pred.length === 0) {
    return () => true;
  }

  const s = { __: and(pred) };
  const q = mark.query(mark.filterBy?.predicate(mark));
  const p = q.groupby().length ? q.select(s) : q.$select(s);

  const data = await coordinator().query(p);
  const v = data.getChild?.('__');
  return v ? (i => v.get(i)) : (i => data[i].__);
}
