import { select, min, max } from 'd3';
import { and, isBetween } from '@uwdata/mosaic-sql';
import { brush } from './util/brush.js';
import { closeTo } from './util/close-to.js';
import { getField } from './util/get-field.js';
import { invert } from './util/invert.js';
import { patchScreenCTM } from './util/patchScreenCTM.js';
import { sanitizeStyles } from './util/sanitize-styles.js';

const asc = (a, b) => a - b;

export class Interval2D {
  constructor(mark, {
    selection,
    xfield,
    yfield,
    pixelSize = 1,
    peers = true,
    brush: style
  }) {
    this.mark = mark;
    this.pixelSize = pixelSize || 1;
    this.selection = selection;
    this.peers = peers;
    this.xfield = xfield || getField(mark, ['x', 'x1', 'x2']);
    this.yfield = yfield || getField(mark, ['y', 'y1', 'y2']);
    this.style = style && sanitizeStyles(style);
    this.brush = brush();
    this.brush.on('brush end', ({ selection }) => this.publish(selection));
  }

  reset() {
    this.value = undefined;
    if (this.g) this.brush.reset(this.g);
  }

  activate() {
    this.selection.activate(this.clause(this.value || [[0, 1], [0, 1]]));
  }

  publish(extent) {
    const { value, pixelSize, xscale, yscale } = this;
    let xr = undefined;
    let yr = undefined;
    if (extent) {
      const [a, b] = extent;
      xr = [a[0], b[0]].map(v => invert(v, xscale, pixelSize)).sort(asc);
      yr = [a[1], b[1]].map(v => invert(v, yscale, pixelSize)).sort(asc);
    }

    if (!closeTo(xr, value?.[0]) || !closeTo(yr, value?.[1])) {
      this.value = extent ? [xr, yr] : undefined;
      this.g.call(this.brush.moveSilent, extent);
      this.selection.update(this.clause(this.value));
    }
  }

  clause(value) {
    const { mark, pixelSize, xfield, yfield, xscale, yscale } = this;
    return {
      source: this,
      schema: { type: 'interval', pixelSize, scales: [xscale, yscale] },
      clients: this.peers ? mark.plot.markSet : new Set().add(mark),
      value,
      predicate: value
        ? and(isBetween(xfield, value[0]), isBetween(yfield, value[1]))
        : null
    };
  }

  init(svg) {
    const { brush, style } = this;
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

    if (style) {
      const brushes = this.g.selectAll('rect.selection');
      for (const name in style) {
        brushes.attr(name, style[name]);
      }
    }

    if (this.value) {
      const [x1, x2] = this.value[0].map(xscale.apply).sort(asc);
      const [y1, y2] = this.value[1].map(yscale.apply).sort(asc);
      this.g.call(brush.moveSilent, [[x1, y1], [x2, y2]]);
    }

    svg.addEventListener('pointerenter', () => this.activate());
  }
}
