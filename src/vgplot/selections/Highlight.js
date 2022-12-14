export class Highlight {
  constructor(mark, signal, opacity) {
    this.mark = mark;
    this.signal = signal;
    this.opacity = opacity;

    this.pending = false;
    this.signal.addListener(() => {
      if (!this.pending) {
        this.pending = true;
        requestAnimationFrame(() => {
          this.init(this.svg);
        });
      }
    });
  }

  init(svg) {
    this.svg = svg;
    this.pending = false;
    if (!svg) return;

    const test = makePredicate(this.signal.value);
    const opacity = this.opacity;

    const { children } = svg.querySelector('g[aria-label="dot"]');
    for (let i = 0; i < children.length; ++i) {
      const node = children[i];
      node.setAttribute('opacity', test(node.__data__) ? 1.0 : opacity);
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
