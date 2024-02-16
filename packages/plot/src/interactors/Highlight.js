import { throttle } from '@uwdata/mosaic-core';
import { and } from '@uwdata/mosaic-sql';
import { sanitizeStyles } from './util/sanitize-styles.js';

function configureMark(mark) {
  const { channels } = mark;
  const dims = new Set;
  let ordered = false;
  let aggregate = false;

  for (const c of channels) {
    const { channel, field, as } = c;
    if (channel === 'orderby') {
      ordered = true;
    } else if (field) {
      if (field.aggregate) {
        aggregate = true;
      } else {
        if (dims.has(as)) continue;
        dims.add(as);
      }
    }
  }

  // if orderby is defined, we're ok: nothing to do
  // or, if there is no groupby aggregation, we're ok: nothing to do
  // grouping may result in optimizations that change result order
  // so we orderby the grouping dimensions to ensure stable indices
  if (!ordered && aggregate && dims.size) {
    mark.channels.push(({ channel: 'orderby', value: Array.from(dims) }));
  }

  return mark;
}

export class Highlight {
  constructor(mark, {
    selection,
    channels = {}
  }) {
    this.mark = configureMark(mark);
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

  // set flag so we do not skip cross-filtered sources
  const filter = mark.filterBy?.predicate(mark, true);

  const s = { __: and(pred) };
  const q = mark.query(filter);
  const p = q.groupby().length ? q.select(s) : q.$select(s);

  const data = await mark.coordinator.query(p);
  const v = data.getChild?.('__');
  return !(data.numRows || data.length) ? (() => false)
    : v ? (i => v.get(i))
    : (i => data[i].__);
}
