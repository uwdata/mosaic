import { clauseInterval } from '@uwdata/mosaic-core';
import { ascending, min, max, select } from 'd3';
import { brushX, brushY } from './util/brush.js';
import { closeTo } from './util/close-to.js';
import { getField } from './util/get-field.js';
import { invert } from './util/invert.js';
import { patchScreenCTM } from './util/patchScreenCTM.js';
import { sanitizeStyles } from './util/sanitize-styles.js';

export class Interval1D {
  constructor(mark, {
    channel,
    selection,
    field = undefined,
    pixelSize = 1,
    peers = true,
    brush: style
  }) {
    this.mark = mark;
    this.channel = channel;
    this.pixelSize = pixelSize || 1;
    this.selection = selection;
    this.peers = peers;
    this.field = field || getField(mark, channel);
    this.style = style && sanitizeStyles(style);
    this.brush = channel === 'y' ? brushY() : brushX();
    this.brush.on('brush end', ({ selection }) => this.publish(selection));
  }

  reset() {
    this.value = undefined;
    if (this.g) this.brush.reset(this.g);
  }

  activate() {
    this.selection.activate(this.clause(this.value || [0, 1]));
  }

  publish(extent) {
    let range = undefined;
    if (extent) {
      range = extent
        .map(v => invert(v, this.scale, this.pixelSize))
        .sort((a, b) => a - b);
    }
    if (!closeTo(range, this.value)) {
      this.value = range;
      this.g.call(this.brush.moveSilent, extent);
      this.selection.update(this.clause(range));
    }
  }

  clause(value) {
    const { mark, pixelSize, field, scale } = this;
    return clauseInterval(field, value, {
      source: this,
      clients: this.peers ? mark.plot.markSet : new Set().add(mark),
      scale,
      pixelSize
    });
  }

  init(svg, root) {
    const { brush, channel, style } = this;
    this.scale = svg.scale(channel);

    const rx = svg.scale('x').range;
    const ry = svg.scale('y').range;
    brush.extent([[min(rx), min(ry)], [max(rx), max(ry)]]);

    const range = this.value?.map(this.scale.apply).sort(ascending);
    const facets = select(svg).selectAll('g[aria-label="facet"]');
    root = facets.size() ? facets : select(root ?? svg);
    this.g = root
      .append('g')
      .attr('class', `interval-${channel}`)
      .each(patchScreenCTM)
      .call(brush)
      .call(brush.moveSilent, range);

    if (style) {
      const brushes = this.g.selectAll('rect.selection');
      for (const name in style) {
        brushes.attr(name, style[name]);
      }
    }

    svg.addEventListener('pointerenter', evt => {
      if (!evt.buttons) this.activate();
    });
  }
}
