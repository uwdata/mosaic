export class PointSelection {
  constructor(mark, signal, channels) {
    this.mark = mark;
    this.signal = signal;
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
    const { mark, channels, signal } = this;
    const group = svg.querySelector(`[data-index="${mark.index}"]`);
    const data = mark._data;

    svg.addEventListener('click', evt => {
      const target = evt.target;
      const type = 'equals';
      const s = { source: mark };

      if (target.parentNode === group) {
        const index = target.__data__;
        const d = data[index];

        if (channels.length === 1) {
          const [channel, field] = channels[0];
          s.channel = channel;
          s.field = field;
          s.type = type;
          s.value = d[channel];
        } else {
          s.type = 'and';
          const value = s.value = [];
          for (let j = 0; j < channels.length; ++j) {
            const [channel, field] = channels[j];
            value.push({ channel, field, type, value: d[channel] });
          }
        }
      }
      signal.resolve(s);
    });
  }
}
