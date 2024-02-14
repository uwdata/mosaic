import { isSelection } from '@uwdata/mosaic-core';
import { eq, literal } from '@uwdata/mosaic-sql';
import { select, pointer } from 'd3';
import { getField } from './util/get-field.js';

export class Nearest {
  constructor(mark, {
    selection,
    channel,
    field
  }) {
    this.mark = mark;
    if (Array.isArray(selection)) {
      this.selections = selection;
    } else {
      this.selections = [selection];
    }
    this.clients = new Set().add(mark);
    this.channel = channel;
    this.field = field || getField(mark, [channel]);
  }

  clause(value) {
    const { clients, field } = this;
    const predicate = value ? eq(field, literal(value)) : null;
    return {
      source: this,
      schema: { type: 'point' },
      clients,
      value,
      predicate
    };
  }

  init(svg) {
    const that = this;
    const { mark, channel, selections } = this;
    const { data } = mark;
    const key = mark.channelField(channel).as;

    const facets = select(svg).selectAll('g[aria-label="facet"]');
    const root = facets.size() ? facets : select(svg);
    const scale = svg.scale(channel);

    root.on('pointerdown pointermove', function(evt) {
      const [x, y] = pointer(evt, this);
      const z = findNearest(data, key, scale.invert(channel === 'x' ? x : y));
      selections.forEach(selection => {
	const param = !isSelection(selection);
	selection.update(param ? z : that.clause(z));
      });
    });

    selections.forEach(selection => {
      if (!isSelection(selection)) return;
      svg.addEventListener('pointerenter', () => {
	selection.activate(this.clause(0));
      });
    });
  }
}

function findNearest(data, key, value) {
  let dist = Infinity;
  let v;
  data.forEach(d => {
    const delta = Math.abs(d[key] - value);
    if (delta < dist) {
      dist = delta;
      v = d[key];
    }
  });
  return v;
}
