import { and, or, eq, literal } from '../../sql/index.js';

export class PointSelection {
  constructor(mark, {
    selection,
    channels
  }) {
    this.mark = mark;
    this.selection = selection;
    this.state = new Map;
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

  init(svg) {
    const { mark, channels, selection, state } = this;
    const groups = Array.from(svg.querySelectorAll(`[data-index="${mark.index}"]`));
    const { data } = mark;

    svg.addEventListener('click', evt => {
      const target = evt.target;
      let value = null;

      if (groups.includes(target.parentNode)) {
        const index = target.__data__;
        const datum = data[index];
        const vals = channels.map(([channel]) => datum[channel]);
        const key = '[' + vals.join() + ']';

        // update selection state
        if (evt.shiftKey) {
          if (state.has(key)) {
            state.delete(key);
          } else {
            state.set(key, vals);
          }
        } else {
          state.clear();
          state.set(key, vals);
        }

        value = Array.from(state.values());
      } else {
        state.clear();
      }

      selection.update(this.clause(value));
    });

    svg.addEventListener('mouseenter', () => {
      this.selection.activate(this.clause([this.channels.map(() => 0)]));
    });
  }
}
