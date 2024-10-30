import { clauseIntervals } from '@uwdata/mosaic-core';
import { ascending, min, max } from 'd3';
import { brush, brushGroups } from './util/brush.js';
import { closeTo } from './util/close-to.js';
import { getField } from './util/get-field.js';
import { invert } from './util/invert.js';
import { sanitizeStyles } from './util/sanitize-styles.js';

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
    this.xfield = xfield || getField(mark, 'x');
    this.yfield = yfield || getField(mark, 'y');
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
      xr = [a[0], b[0]].map(v => invert(v, xscale, pixelSize)).sort(ascending);
      yr = [a[1], b[1]].map(v => invert(v, yscale, pixelSize)).sort(ascending);
    }

    if (!closeTo(xr, value?.[0]) || !closeTo(yr, value?.[1])) {
      this.value = extent ? [xr, yr] : undefined;
      this.g.call(this.brush.moveSilent, extent);
      this.selection.update(this.clause(this.value));
    }
  }

  clause(value) {
    const { mark, pixelSize, xfield, yfield, xscale, yscale } = this;
    return clauseIntervals([xfield, yfield], value, {
      source: this,
      clients: this.peers ? mark.plot.markSet : new Set().add(mark),
      scales: [xscale, yscale],
      pixelSize
    });
  }

  init(svg) {
    const { brush, style, value } = this;
    const xscale = this.xscale = svg.scale('x');
    const yscale = this.yscale = svg.scale('y');
    const rx = xscale.range;
    const ry = yscale.range;
    brush.extent([[min(rx), min(ry)], [max(rx), max(ry)]]);
    this.g = brushGroups(svg, null, min(rx), min(ry), 'interval-xy').call(brush);

    if (style) {
      const brushes = this.g.selectAll('rect.selection');
      for (const name in style) {
        brushes.attr(name, style[name]);
      }
    }

    if (value) {
      const [x1, x2] = value[0].map(xscale.apply).sort(ascending);
      const [y1, y2] = value[1].map(yscale.apply).sort(ascending);
      this.g.call(brush.moveSilent, [[x1, y1], [x2, y2]]);
    }

    svg.addEventListener('pointerenter', evt => {
      if (!evt.buttons) this.activate();
    });
  }
}
