import { and, or, eq, literal } from '@uwdata/mosaic-sql';

export class PointSelection {
  constructor(mark, {
    selection,
    channels
  }) {
    this.mark = mark;
    this.selection = selection;
    this.clients = new Set().add(mark);
    this.channels = channels.map(c => {
      const q = c === 'color' ? ['fill', 'stroke']
        : c === 'x' ? ['x', 'x1', 'x2']
        : c === 'y' ? ['y', 'y1', 'y2']
        : [c];
      for (let i = 0; i < q.length; ++i) {
        const f = mark.channelField(q[i]);
        if (f) return [q[i], f];
      }
      throw new Error(`Missing channel: ${c}`);
    });
  }

  clause(value) {
    const { channels, clients } = this;
    let predicate = null;

    if (value) {
      const clauses = value.map(vals => {
        const list = vals.map((v, i) => eq(channels[i][1], literal(v)));
        return list.length > 1 ? and(list) : list[0];
      });
      predicate = clauses.length > 1 ? or(clauses) : clauses[0];
    }

    return {
      source: this,
      schema: { type: 'point' },
      clients,
      value,
      predicate
    };
  }

  init(svg, selector, accessor) {
    const { mark, channels, selection } = this;
    const { data } = mark;
    accessor = accessor || (target => {
      const datum = data[target.__data__];
      return channels.map(([channel]) => datum[channel]);
    });

    selector = selector || `[data-index="${mark.index}"]`;
    const groups = new Set(svg.querySelectorAll(selector));

    svg.addEventListener('click', evt => {
      const target = evt.target;
      let value = null;

      if (isSelectionTarget(groups, target)) {
        const state = selection.single ? selection.value : this.value;
        const point = accessor(target);
        if (evt.shiftKey && state?.length) {
          value = state.filter(s => neq(s, point));
          if (value.length === state.length) value.push(point);
        } else {
          value = [point];
        }
      }

      this.value = value;
      selection.update(this.clause(value));
    });

    svg.addEventListener('mouseenter', () => {
      this.selection.activate(this.clause([this.channels.map(() => 0)]));
    });
  }
}

function isSelectionTarget(groups, node) {
  return groups.has(node)
    || groups.has(node.parentNode)
    || groups.has(node.parentNode?.parentNode);
}

function neq(a, b) {
  const n = a.length;
  if (b.length !== n) return true;
  for (let i = 0; i < n; ++i) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}
