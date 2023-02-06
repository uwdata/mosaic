import { MosaicClient } from '@uwdata/mosaic-core';
import { Query, column } from '@uwdata/mosaic-sql';
import { isColor } from './util/is-color.js';

const constantOptions = new Set([
  'order',
  'curve',
  'tension',
  'marker',
  'textAnchor',
  'lineAnchor',
  'lineHeight',
  'monospace',
  'fontFamily',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'frameAnchor',
  'strokeLinejoin',
  'strokeLinecap',
  'strokeMiterlimit',
  'strokeDasharray',
  'strokeDashoffset',
  'mixBlendMode',
  'shapeRendering',
  'paintOrder',
  'pointerEvents'
]);

const isParam = obj => typeof obj?.addEventListener === 'function';
const isColorChannel = channel => channel === 'stroke' || channel === 'fill';
const isConstantOption = channel => constantOptions.has(channel);

export class Mark extends MosaicClient {
  constructor(type, source, encodings) {
    super(source?.options?.filterBy);
    this.type = type;

    this.source = source;
    if (Array.isArray(this.source)) {
      this.data = this.source;
    }

    const channels = this.channels = [];
    const params = this.params = new Set;

    const process = (channel, entry) => {
      const type = typeof entry;
      if (type === 'function') {
        const enc = entry(channel, this.type);
        for (const key in enc) {
          process(key, enc[key]);
        }
      } else if (type === 'string') {
        if (isConstantOption(channel) || isColorChannel(channel) && isColor(entry)) {
          // interpret color names and other constants as values, not fields
          channels.push({ channel, value: entry });
        } else {
          channels.push({ channel, field: column(entry) });
        }
      } else if (isParam(entry)) {
        if (entry.columns) {
          channels.push({ channel, field: entry });
          params.add(entry);
        } else {
          const c = { channel, value: entry.value };
          channels.push(c);
          entry.addEventListener('value', value => {
            c.value = value;
            this.update();
          });
        }
      } else if (type === 'object') {
        channels.push({ channel, field: entry });
      } else {
        channels.push({ channel, value: entry });
      }
    };

    for (const channel in encodings) {
      process(channel, encodings[channel]);
    }
  }

  setPlot(plot, index) {
    this.plot = plot;
    this.index = index;
    plot.addParams(this, this.params);
    if (this.source?.table) this.queryPending();
  }

  channel(channel) {
    return this.channels.find(c => c.channel === channel);
  }

  channelField(...channels) {
    const list = channels.flat();
    for (const channel of list) {
      const field = this.channel(channel)?.field;
      if (field) return field;
    }
    return null;
  }

  fields() {
    const { source, channels } = this;
    if (source == null || Array.isArray(source)) return [];
    const { table } = source;
    const columns = new Set;
    for (const { field } of channels) {
      // TODO use field columns, not column
      if (field?.column) columns.add(field.column);
    }
    return Array.from(columns, col => column(table, col));
  }

  fieldStats(data) {
    this.stats = data;
    return this;
  }

  query(filter = []) {
    const { channels, source, stats } = this;

    if (source == null || Array.isArray(source)) {
      return null;
    }

    const q = Query.from({ source: source.table });
    const dims = [];
    let aggr = false;

    for (const c of channels) {
      if (c.channel === 'order') {
        q.orderby(c.value);
      } else if (Object.hasOwn(c, 'field')) {
        const { channel, field } = c;
        if (field.column && !stats.find(s => s.column === field.column)) {
          continue; // skip non-existent columns
        }
        const expr = field.transform?.(stats) || field;
        if (expr.aggregate) {
          aggr = true;
        } else {
          dims.push(channel);
        }
        q.select({ [channel]: expr });
      }
    }

    if (aggr) {
      q.groupby(dims);
    }

    return q.where(filter);
  }

  queryPending() {
    this.plot.pending(this);
    return this;
  }

  queryResult(data) {
    this.data = Array.from(data);
    return this;
  }

  update() {
    this.plot.update(this);
    return this;
  }

  plotSpecs() {
    const { type, data, channels } = this;
    const options = {};
    for (const c of channels) {
      options[c.channel] = Object.hasOwn(c, 'value') ? c.value : c.channel;
    }
    return [{ type, data, options }];
  }
}
