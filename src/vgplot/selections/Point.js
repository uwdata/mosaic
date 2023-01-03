import { and, or, eq, literal } from '../../sql/index.js';

export class PointSelection {
  constructor(mark, selection, channels) {
    this.mark = mark;
    this.selection = selection;
    this.state = new Map;
    this.channels = channels.map(c => {
      const q = c === 'color' ? ['fill', 'stroke']
        : c === 'x' ? ['x', 'x1', 'x2']
        : c === 'y' ? ['y', 'y1', 'y2']
        : [c];
      for (let i = 0; i < q.length; ++i) {
        const f = mark.channelField(q[i]);
        if (f) return [q[i], f.column];
      }
      throw new Error(`Missing channel: ${c}`);
    });
  }

  init(svg) {
    const { mark, channels, selection, state } = this;
    const groups = Array.from(svg.querySelectorAll(`[data-index="${mark.index}"]`));
    const data = mark._data;

    svg.addEventListener('click', evt => {
      const target = evt.target;
      const s = {
        source: mark,
        predicate: null
      };

      if (groups.includes(target.parentNode)) {
        const index = target.__data__;
        const d = data[index];

        const values = channels.map(([channel]) => d[channel]);
        const key = '[' + values.join() + ']';

        // update selection state
        if (evt.shiftKey) {
          if (state.has(key)) {
            state.delete(key);
          } else {
            state.set(key, values);
          }
        } else {
          state.clear();
          state.set(key, values);
        }

        // generate query clauses
        const clauses = [];
        for (const vals of state.values()) {
          const pred = channels.map(([channel, field], i) => {
            return eq(field, literal(vals[i]));
            // { channel, field, type: 'equals', value: vals[i] };
          });
          if (pred.length > 1) {
            clauses.push(and(pred));
          } else {
            clauses.push(pred[0]);
          }
        }

        s.predicate = clauses.length > 1 ? or(clauses) : clauses[0];
      } else {
        state.clear();
      }

      selection.update(s);
    });
  }
}
