import { select, min, max } from 'd3';
import { isBetween } from '@uwdata/mosaic-sql';
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
    field,
    pixelSize = 1,
    peers = true,
    brush: style
  }) {
    this.mark = mark;
    this.channel = channel;
    this.pixelSize = pixelSize || 1;
    this.selection = selection;
    this.peers = peers;
    this.field = field || getField(mark, [channel, channel+'1', channel+'2']);
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
    return {
      source: this,
      schema: { type: 'interval', pixelSize, scales: [scale] },
      clients: this.peers ? mark.plot.markSet : new Set().add(mark),
      value,
      predicate: value ? isBetween(field, value) : null
    };
  }

  init(svg) {
    const { brush, channel, style } = this;
    this.scale = svg.scale(channel);

    const rx = svg.scale('x').range;
    const ry = svg.scale('y').range;
    brush.extent([[min(rx), min(ry)], [max(rx), max(ry)]]);

    const facets = select(svg).selectAll('g[aria-label="facet"]');
    const root = facets.size() ? facets : select(svg);
    this.g = root
      .append('g')
      .attr('class', `interval-${channel}`)
      .each(patchScreenCTM)
      .call(brush)
      .call(brush.moveSilent, this.value?.map(this.scale.apply));

    if (style) {
      const brushes = this.g.selectAll('rect.selection');
      for (const name in style) {
        brushes.attr(name, style[name]);
      }
    }

    svg.addEventListener('pointerenter', () => this.activate());
  }
}
