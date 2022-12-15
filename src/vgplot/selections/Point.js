export class PointSelection {
  constructor(mark, signal, channels) {
    this.mark = mark;
    this.signal = signal;
    this.state = new Map;
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

  init(svg) {
    const { mark, channels, signal, state } = this;
    const groups = Array.from(svg.querySelectorAll(`[data-index="${mark.index}"]`));
    const data = mark._data;

    svg.addEventListener('click', evt => {
      const target = evt.target;
      const s = { source: mark };

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
          const value = channels.map(([channel, field], i) => {
            return { channel, field, type: 'equals', value: vals[i] };
          });
          if (value.length > 1) {
            clauses.push({ type: 'and', value });
          } else {
            clauses.push(value[0]);
          }
        }

        if (clauses.length > 1) {
          s.type = 'or';
          s.value = clauses;
        } else {
          Object.assign(s, clauses[0]);
        }
      } else {
        state.clear();
      }

      signal.resolve(s);
    });
  }
}
