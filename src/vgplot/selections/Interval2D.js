import { brush, select } from 'd3';
import { closeTo } from './close-to.js';

export class Interval2DSelection {
  constructor(mark, signal, xfield, yfield) {
    this.mark = mark;
    this.signal = signal;

    this.xfield = xfield || mark.channelField('x', 'x1', 'x2');
    this.yfield = yfield || mark.channelField('y', 'y1', 'y2');
    this.brush = brush();

    this.brush.on('brush end', ({ selection }) => {
      let xrange = undefined;
      let yrange = undefined;
      if (selection) {
        const [a, b] = selection;
        xrange = [a[0], b[0]].map(this.xscale.invert).sort((a, b) => a - b);
        yrange = [a[1], b[1]].map(this.yscale.invert).sort((a, b) => a - b);
      }
      if (!closeTo(xrange, this.xsel) || !closeTo(yrange, this.ysel)) {
        this.xsel = xrange;
        this.ysel = yrange;
        this.signal.resolve({
          source: this.mark,
          type: 'and',
          value: [
            { field: this.xfield, type: 'range', value: xrange },
            { field: this.yfield, type: 'range', value: yrange }
          ]
        });
      }
    });
  }

  init(svg) {
    const { brush, mark } = this;
    const { left, top, bottom, right } = mark.plot.margins();
    const width = +svg.getAttribute('width');
    const height = +svg.getAttribute('height');

    this.xscale = svg.scale('x');
    this.yscale = svg.scale('y');
    brush.extent([[left, top], [width - right, height - bottom]]);

    const g = select(svg)
      .append('g')
      .attr('class', 'interval-xy')
      .call(brush);

    if (this.xsel && this.ysel) {
      g.call(brush.move, [
        this.xsel.map(this.xscale.apply),
        this.ysel.map(this.yscale.apply)
      ]);
    }
  }
}
