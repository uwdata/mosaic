import { brushX, brushY, select } from 'd3';
import { closeTo } from './close-to.js';

export class Interval1DSelection {
  constructor(mark, channel, signal, field) {
    this.mark = mark;
    this.channel = channel;
    this.signal = signal;

    this.field = field || mark.channelField(channel, channel+'1', channel+'2');
    this.brush = channel === 'y' ? brushY() : brushX();

    this.brush.on('brush end', ({ selection }) => {
      let range = null;
      if (selection) {
        range = selection.map(this.scale.invert).sort((a, b) => a - b);
      }
      if (!closeTo(range, this.selection)) {
        this.selection = range;
        this.signal.resolve({
          source: this.mark,
          field: this.field,
          type: 'range',
          value: range
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

    if (this.selection) {
      g.call(brush.move, this.selection.map(this.scale.apply));
    }
  }
}
