export class Highlight {
  constructor(mark, signal, channels = { opacity: 0.1 }) {
    this.mark = mark;
    this.signal = signal;
    this.channels = Object.entries(channels);
    this.pending = false;
    this.signal.addListener(() => {
      if (!this.pending) {
        this.pending = true;
        requestAnimationFrame(() => this.update());
      }
    });
  }

  init(svg) {
    this.svg = svg;
    const values = this.values = [];
    const nodes = this.nodes
      = svg.querySelectorAll(`[data-index="${this.mark.index}"] > *`);

    const { channels } = this;
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      values.push(channels.map(c => node.getAttribute(c[0])));
    }

    this.update();
  }

  update() {
    this.pending = false;
    const { svg, nodes, channels, signal, values } = this;
    if (!svg) return;

    const test = makePredicate(signal.value);
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      const base = values[i];
      const t = test(node.__data__);
      // TODO: handle inherited values / remove attributes
      for (let j = 0; j < channels.length; ++j) {
        const c = channels[j];
        node.setAttribute(c[0], t ? base[j] : c[1]);
      }
    }
  }
}

function makePredicate(spec) {
  const clauses = (spec || []).map(s => {
    return makeClause(s, s.source._data);
  }).filter(x => x);

  return clauses.length === 0 ? () => true
    : clauses.length === 1 ? clauses[0]
    : i => clauses.every(test => test(i));
}

function makeClause(spec, data) {
  switch (spec.type) {
    case 'and':
      const clauses = spec.value.map(s => makeClause(s, data)).filter(x => x);
      return clauses.length === 0 ? null
        : clauses.length === 1 ? clauses[1]
        : i => clauses.every(test => test(i));
    case 'range':
      if (!spec.value) {
        return null;
      } else {
        const channel = spec.channel;
        const [min, max] = spec.value;
        return i => min <= data[i][channel] && data[i][channel] <= max;
      }
    default:
      throw new Error(`Unsupported predicate type: ${spec.type}`);
  }
}
