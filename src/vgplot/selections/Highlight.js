import { throttle } from '../../mosaic/util/throttle.js';
import { and } from '../../sql/index.js';

const queryCache = new Map;

export class Highlight {
  constructor(mark, selection, channels = { opacity: 0.1 }) {
    this.mark = mark;
    this.selection = selection;
    this.channels = Object.entries(channels);
    this.selection.addListener(throttle(() => this.update()));
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
      // TODO: handle inherited values / remove attributes
      for (let j = 0; j < channels.length; ++j) {
        const [attr, value] = channels[j];
        node.setAttribute(attr, t ? base[j] : value);
      }
    }
  }
}

function predicateFunction(mark, selection) {
  const pred = selection?.predicate(mark);

  if (!pred || pred.length === 0) {
    return () => true;
  }

  const q = mark.query(mark.filter()?.predicate(mark)).$select({ __: and(pred) });
  const sql = q.toString();
  const memo = queryCache.get(selection);
  if (memo?.key === sql) {
    return memo.value;
  } else {
    const promise = mark.mc.query(sql).then(data => {
      const v = data.getChild?.('__');
      return v ? (i => v.get(i)) : (i => data[i].sel);
    });
    queryCache.set(selection, { key: sql, value: promise });
    return promise;
  }
}
