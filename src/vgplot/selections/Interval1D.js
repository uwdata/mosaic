import { brushX, brushY, select, min, max } from 'd3';
import { isBetween } from '../../sql/index.js';
import { closeTo } from './close-to.js';

export class Interval1DSelection {
  constructor(mark, channel, selection, field) {
    this.mark = mark;
    this.channel = channel;
    this.selection = selection;
    this.field = field || mark.channelField(channel, channel+'1', channel+'2').column;
    this.brush = channel === 'y' ? brushY() : brushX();

    this.brush.on('brush end', ({ selection }) => {
      let range = undefined;
      if (selection) {
        range = selection.map(this.scale.invert).sort((a, b) => a - b);
      }
      if (!closeTo(range, this.value)) {
        this.value = range;
        this.g.call(this.brush.move, selection);
        this.selection.update({
          source: this.mark,
          channels: [this.channel],
          fields: [this.field],
          value: range,
          predicate: range ? isBetween(this.field, range) : null
        });
      }
    });
  }

  init(svg) {
    const { brush, channel } = this;
    this.scale = svg.scale(channel);

    const rx = svg.scale('x').range;
    const ry = svg.scale('y').range;
    brush.extent([[min(rx), min(ry)], [max(rx), max(ry)]]);

    const facets = select(svg).selectAll('g[aria-label="facet"]');
    const root = facets.size() ? facets : select(svg);
    this.g = root
      .append('g')
      .attr('class', `interval-${channel}`)
      .call(brush)
      .call(brush.move, this.value?.map(this.scale.apply));
  }
}
