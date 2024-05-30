import { isSelection, point } from '@uwdata/mosaic-core';
import { select, pointer } from 'd3';
import { getField } from './util/get-field.js';
import { getScale } from './util/scale.js';

export class Nearest {
  constructor(mark, {
    selection,
    channel,
    field
  }) {
    this.mark = mark;
    this.selection = selection;
    this.clients = new Set().add(mark);
    this.channel = channel;
    this.field = field || getField(mark, [channel]);
  }

  clause(value) {
    const { clients, field } = this;
    return point(field, value, { source: this, clients });
  }

  init(svg) {
    const that = this;
    const { mark, channel, selection } = this;
    const { data } = mark;
    const key = mark.channelField(channel).as;

    const facets = select(svg).selectAll('g[aria-label="facet"]');
    const root = facets.size() ? facets : select(svg);
    const scale = getScale(svg, channel, mark.plot);
    const param = !isSelection(selection);

    root.on('pointerdown pointermove', function(evt) {
      const [x, y] = pointer(evt, this);
      const z = findNearest(data.columns[key], scale.invert(channel === 'x' ? x : y));
      selection.update(param ? z : that.clause(z));
    });

    if (param) return;
    svg.addEventListener('pointerenter', evt => {
      if (!evt.buttons) this.selection.activate(this.clause(0));
    });
  }
}

function findNearest(values, value) {
  let dist = Infinity;
  let nearest;

  for (let i = 0; i < values.length; ++i) {
    const delta = Math.abs(values[i] - value);
    if (delta < dist) {
      dist = delta;
      nearest = values[i];
    }
  }
  return nearest;
}
