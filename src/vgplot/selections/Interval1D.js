import { brushX, brushY, select } from 'd3';
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
    const { brush, channel, mark } = this;
    const { left, top, bottom, right } = mark.plot.margins();
    const width = +svg.getAttribute('width');
    const height = +svg.getAttribute('height');

    this.scale = svg.scale(channel);
    brush.extent([[left, top], [width - right, height - bottom]]);

    const g = select(svg)
      .append('g')
      .attr('class', `interval-${channel}`)
      .call(brush);

    if (this.value) {
      g.call(brush.move, this.value.map(this.scale.apply));
    }
  }
}
