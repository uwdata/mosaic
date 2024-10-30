import { clausePoints } from '@uwdata/mosaic-core';
import { select } from 'd3';
import { brush } from './util/brush.js';
import { getFields } from './util/get-field.js';
import { intersect } from './util/intersect.js';
import { patchScreenCTM } from './util/patchScreenCTM.js';
import { sanitizeStyles } from './util/sanitize-styles.js';
import { neqSome } from './util/neq.js';
import { getDatum } from './util/get-datum.js';

export class Region {
  constructor(mark, {
    channels,
    selection,
    peers = true,
    brush: style = {
      fill: 'none',
      stroke: 'currentColor',
      strokeDasharray: '1,1'
    }
  }) {
    this.mark = mark;
    this.selection = selection;
    this.peers = peers;

    this.style = style && sanitizeStyles(style);
    this.brush = brush();
    this.brush.on('brush end', evt => this.publish(evt.selection));
    this.extent = null;
    this.groups = null;

    const { fields, as } = getFields(mark, channels);
    this.fields = fields;
    this.as = as;
  }

  reset() {
    this.value = undefined;
    this.extent = null;
    if (this.g) this.brush.reset(this.g);
  }

  activate() {
    this.selection.activate(this.clause([this.fields.map(() => 0)]));
  }

  clause(value) {
    const { fields, mark } = this;
    return clausePoints(fields, value, {
      source: this,
      clients: this.peers ? mark.plot.markSet : new Set().add(mark)
    });
  }

  publish(extent) {
    const { as, group, mark, svg } = this;
    let value;

    // extract channel values for points
    if (extent) {
      const { data: { columns = {} } = {} } = mark;
      const map = new Map;
      intersect(svg, group, extent).forEach(el => {
        const index = getDatum(el);
        const vals = as.map(name => columns[name][index]);
        map.set(vals.join('|'), vals); // deduplicate values
      });
      value = Array.from(map.values());
    }
    this.extent = extent;

    if (neqSome(value, this.value)) {
      this.value = value;
      this.selection.update(this.clause(value));
    }
  }

  init(svg) {
    const { brush, extent, mark, style } = this;
    this.svg = svg;

    const w = svg.width.baseVal.value;
    const h = svg.height.baseVal.value;
    brush.extent([[0, 0], [w, h]]);

    // isolate eligible mark group
    this.group = svg.querySelector(`[data-index="${mark.index}"]`);

    // create a single brush, regardless of facets
    this.g = select(svg)
      .append('g')
      .attr('class', `region-xy`)
      .each(patchScreenCTM)
      .call(brush)
      .call(brush.moveSilent, extent);

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
