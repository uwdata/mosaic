import { brushX, brushY, select, min, max } from 'd3';
import { isBetween } from '@uwdata/mosaic-sql';
import { closeTo } from './util/close-to.js';
import { patchScreenCTM } from './util/patchScreenCTM.js';
import { sanitizeStyles } from './util/sanitize-styles.js';

export class Interval1DSelection {
  constructor(mark, {
    channel,
    selection,
    field,
    peers = true,
    brush: style
  }) {
    this.mark = mark;
    this.channel = channel;
    this.selection = selection;
    this.peers = peers;
    this.field = field || mark.channelField(channel, channel+'1', channel+'2');
    this.field = this.field?.column || this.field;
    this.style = style && sanitizeStyles(style);
    this.brush = channel === 'y' ? brushY() : brushX();
    this.brush.on('brush end', ({ selection }) => this.publish(selection));
  }

  publish(extent) {
    let range = undefined;
    if (extent) {
      range = extent.map(this.scale.invert).sort((a, b) => a - b);
    }
    if (!closeTo(range, this.value)) {
      this.value = range;
      this.g.call(this.brush.move, extent);
      this.selection.update(this.clause(range));
    }
  }

  clause(value) {
    return {
      source: this,
      schema: { type: 'interval', scales: [this.scale] },
      clients: this.peers ? this.mark.plot.markSet : new Set().add(this.mark),
      value,
      predicate: value ? isBetween(this.field, value) : null
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
      .call(brush.move, this.value?.map(this.scale.apply));

    if (style) {
      const brushes = this.g.selectAll('rect.selection');
      for (const name in style) {
        brushes.attr(name, style[name]);
      }
    }

    svg.addEventListener('mouseenter', () => {
      this.selection.activate(this.clause(this.value || [0, 1]));
    });
  }
}
