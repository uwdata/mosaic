import { brush, select, min, max } from 'd3';
import { and, isBetween } from '../../sql/index.js';
import { closeTo } from './util/close-to.js';
import { patchScreenCTM } from './util/patchScreenCTM.js';

const asc = (a, b) => a - b;

export class Interval2DSelection {
  constructor(mark, selection, xfield, yfield) {
    this.mark = mark;
    this.selection = selection;

    this.xfield = xfield || mark.channelField('x', 'x1', 'x2');
    this.yfield = yfield || mark.channelField('y', 'y1', 'y2');
    this.brush = brush();
    this.brush.on('brush end', ({ selection }) => this.update(selection));
  }

  update(extent) {
    const { value } = this;
    let xr = undefined;
    let yr = undefined;
    if (extent) {
      const [a, b] = extent;
      xr = [a[0], b[0]].map(this.xscale.invert).sort(asc);
      yr = [a[1], b[1]].map(this.yscale.invert).sort(asc);
    }

    if (!closeTo(xr, value?.[0]) || !closeTo(yr, value?.[1])) {
      this.value = extent ? [xr, yr] : null;
      this.g.call(this.brush.move, extent);
      this.selection.update(this.clause(this.value));
    }
  }

  clause(value) {
    return {
      schema: { type: 'interval', scales: [this.xscale, this.yscale] },
      client: this.mark,
      value,
      predicate: value
        ? and(
            isBetween(this.xfield, value[0]),
            isBetween(this.yfield, value[1])
          )
        : null
    };
  }

  init(svg) {
    const { brush } = this;
    const xscale = this.xscale = svg.scale('x');
    const yscale = this.yscale = svg.scale('y');
    const rx = xscale.range;
    const ry = yscale.range;
    brush.extent([[min(rx), min(ry)], [max(rx), max(ry)]]);

    const facets = select(svg).selectAll('g[aria-label="facet"]');
    const root = facets.size() ? facets : select(svg);
    this.g = root
      .append('g')
      .attr('class', `interval-xy`)
      .each(patchScreenCTM)
      .call(brush);

    if (this.value) {
      const [x1, x2] = this.value[0].map(xscale.apply).sort(asc);
      const [y1, y2] = this.value[1].map(yscale.apply).sort(asc);
      this.g.call(brush.move, [[x1, y1], [x2, y2]]);
    }

    svg.addEventListener('mouseenter', () => {
      this.selection.activate(this.clause(this.value || [[0, 1], [0, 1]]));
    });
  }
}
