import { and, or, isNotDistinct, literal } from '@uwdata/mosaic-sql';

export class Toggle {
  /**
   * @param {import('@uwdata/mosaic-plot').Mark} mark The mark.
   * @param {*} options The options.
   */
  constructor(mark, {
    selection,
    channels,
    peers = true
  }) {
    this.value = null;
    /** @type {import('@uwdata/mosaic-plot').Mark} */
    this.mark = mark;
    this.selection = selection;
    this.peers = peers;
    this.channels = channels.map(c => {
      const q = c === 'color' ? ['color', 'fill', 'stroke']
        : c === 'x' ? ['x', 'x1', 'x2']
        : c === 'y' ? ['y', 'y1', 'y2']
        : [c];
      for (let i = 0; i < q.length; ++i) {
        const f = mark.channelField(q[i], { exact: true });
        if (f) return {
          field: f.field?.basis || f.field,
          as: f.as
        };
      }
      throw new Error(`Missing channel: ${c}`);
    });
  }

  clause(value) {
    const { channels, mark } = this;
    let predicate = null;

    if (value) {
      const clauses = value.map(vals => {
        const list = vals.map((v, i) => {
          return isNotDistinct(channels[i].field, literal(v));
        });
        return list.length > 1 ? and(list) : list[0];
      });
      predicate = clauses.length > 1 ? or(clauses) : clauses[0];
    }

    return {
      source: this,
      schema: { type: 'point' },
      clients: this.peers ? mark.plot.markSet : new Set().add(mark),
      value,
      predicate
    };
  }

  init(svg, selector, accessor) {
    const { mark, channels, selection } = this;
    const { data: { columns } = {} } = mark;
    accessor ??= target => channels.map(c => columns[c.as][target.__data__]);
    selector ??= `[data-index="${mark.index}"]`;
    const groups = new Set(svg.querySelectorAll(selector));

    svg.addEventListener('pointerdown', evt => {
      const state = selection.single ? selection.value : this.value;
      const target = evt.target;
      let value = null;

      if (isTargetElement(groups, target)) {
        const point = accessor(target);
        if ((evt.shiftKey || evt.metaKey) && state?.length) {
          value = state.filter(s => neq(s, point));
          if (value.length === state.length) value.push(point);
        } else if (state?.length === 1 && !neq(state[0], point)) {
          value = null;
        } else {
          value = [point];
        }
      }

      this.value = value;
      if (neqSome(state, value)) {
        selection.update(this.clause(value));
      }
    });

    svg.addEventListener('pointerenter', evt => {
      if (evt.buttons) return;
      this.selection.activate(this.clause([this.channels.map(() => 0)]));
    });
  }
}

function isTargetElement(groups, node) {
  return groups.has(node)
    || groups.has(node.parentNode)
    || groups.has(node.parentNode?.parentNode);
}

function neqSome(a, b) {
  return (a == null || b == null)
    ? (a != null || b != null)
    : (a.length !== b.length || a.some((x, i) => neq(x, b[i])));
}

function neq(a, b) {
  const n = a.length;
  if (b.length !== n) return true;
  for (let i = 0; i < n; ++i) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}
