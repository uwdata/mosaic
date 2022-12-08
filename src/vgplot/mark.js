import { isSignal } from '../mosaic/Signal.js';
import { isColor } from './util/is-color.js';
import * as transforms from './transforms/index.js';

const isColorChannel = channel => channel === 'stroke' || channel === 'fill';
const isConstantChannel = channel => channel === 'order';

export class Mark {
  constructor(type, source, encodings) {
    this.type = type;

    this.source = source;
    if (Array.isArray(this.source)) {
      this._data = this.source;
    }

    const channels = this.channels = [];
    for (const channel in encodings) {
      const entry = encodings[channel];
      const type = typeof entry;
      if (type === 'string') {
        if (isConstantChannel(channel) || isColorChannel(channel) && isColor(entry)) {
          // interpret color names as constants, not fields
          channels.push({ channel, value: entry });
        } else {
          channels.push({ channel, field: entry });
        }
      } else if (isSignal(entry)) {
        channels.push({ channel, signal: entry });
      } else if (type === 'object') {
        channels.push({ channel, ...entry });
      } else {
        channels.push({ channel, value: entry });
      }
    }
  }

  channel(channel) {
    return this.channels.find(c => c.channel === channel);
  }

  update() {
    this.plot.update();
    return this;
  }

  stats(data) {
    this._stats = data;
    return this;
  }

  data(data) {
    this._data = data;
    return this;
  }

  filter() {
    return this.source?.options?.filterBy;
  }

  fields() {
    const { source, channels } = this;
    if (source == null) return [];
    const { table } = source;
    const fields = new Set;
    for (const c of channels) {
      if (c.field) {
        fields.add(c.field);
      }
    }
    return Array.from(fields, field => ({ table, field }));
  }

  query() {
    const { plot, channels, source, type, _stats } = this;

    if (source == null || Array.isArray(source)) {
      return null;
    }

    const select = {};
    let order = null;
    for (const c of channels) {
      if (c.channel === 'order') {
        order = [{ field: c.value }]; // TODO arrays
      } else if (Object.hasOwn(c, 'value') || Object.hasOwn(c, 'signal')) {
        // do nothing
      } else if (_stats && c.transform) {
        select[c.channel] = transforms[c.transform](c, _stats);
      } else {
        select[c.channel] = c;
      }
    }

    const q = {
      from: [source.table],
      select: select,
      // TODO: filters
    };

    if (order) {
      q.order = order;
    }

    if (type.startsWith('area') || type.startsWith('line')) {
      const field = select.x.field;
      const { min, max } = _stats.find(s => s.field === field);
      q.transform = [
        {
          type: 'm4',
          field: 'x',
          value: 'y',
          range: [min, max],
          width: plot.innerWidth()
        }
      ];
    }

    return q;
  }

  toSpec() {
    const { type, _data, channels } = this;
    const options = {};
    for (const c of channels) {
      options[c.channel] = Object.hasOwn(c, 'value')
        ? c.value
        : c.channel;
    }
    return { type, data: _data, options };
  }
}
