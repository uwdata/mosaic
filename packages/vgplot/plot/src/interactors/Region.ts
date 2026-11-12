import { InteractorMark } from '../marks/Mark.js';
import { Selection } from '@uwdata/mosaic-core';
import type { Extent, Interactor, SVG } from '../types.js';

import type * as mc from '@uwdata/mosaic-core';
import { clausePoints } from '@uwdata/mosaic-core';
import { select } from 'd3';
import { brush } from './util/brush.js';
import { getFields } from './util/get-field.js';
import { intersect } from './util/intersect.js';
import { patchScreenCTM } from './util/patchScreenCTM.js';
import { sanitizeStyles } from './util/sanitize-styles.js';
import { neqSome } from './util/neq.js';
import { getDatum } from './util/get-datum.js';


export class Region implements Interactor, mc.Activatable {
  mark: InteractorMark;
  selection: Selection;
  peers: boolean;
  style: Record<string, string | number>;
  brush: any;
  extent: Extent | null;
  groups: null;
  fields: any[];
  as: any[];
  value: any;
  g: any;
  svg: any;
  group: any;

  constructor(mark: InteractorMark, {
    channels,
    selection,
    peers = true,
    brush: style = {
      fill: 'none',
      stroke: 'currentColor',
      strokeDasharray: '1,1'
    }
  }: { channels: string[]; selection: Selection; peers?: boolean; brush?: Record<string, string | number>; }) {
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

  reset(): void {
    this.value = undefined;
    this.extent = null;
    if (this.g) this.brush.reset(this.g);
  }

  activate(): void {
    this.selection.activate(this.clause([this.fields.map(() => 0)]));
  }

  clause(value): mc.SelectionClause {
    const { fields, mark } = this;
    return clausePoints(fields, value, {
      source: this,
      //@ts-expect-error
      clients: this.peers ? mark.plot.markSet : new Set([mark])
    });
  }

  publish(extent: Extent): void {
    const { as, group, mark, svg } = this;
    let value;

    // extract channel values for points
    if (extent) {
      // @ts-expect-error Property 'columns' does not exist on type 'DataColumns | {}'.
      const { data: { columns = {} } = {} } = mark;
      const map = new Map;
      intersect(svg, group, extent).forEach(el => {
        //@ts-expect-error Argument of type 'Element' is not assignable to parameter of type 'Element & { __data__: any; }'.
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

  init(svg: SVG): void {
    const { brush, extent, mark, style } = this;
    this.svg = svg;
    //@ts-expect-error Property 'width' does not exist on type 'HTMLElement & Plot'.
    const w = svg.width.baseVal.value;
    //@ts-expect-error Property 'height' does not exist on type 'HTMLElement & Plot'.
    const h = svg.height.baseVal.value;
    brush.extent([[0, 0], [w, h]]);

    // isolate eligible mark group
    this.group = svg.querySelector(`[data-index="${mark.index}"]`);

    // create a single brush, regardless of facets
    this.g = select(svg)
      .append('g')
      .attr('class', 'region-xy')
      .each(patchScreenCTM)
      .call(brush)
      .call(brush.moveSilent, extent);

    if (style) {
      const brushes = this.g.selectAll('rect.selection');
      for (const name in style) {
        brushes.attr(name, style[name]);
      }
    }

    svg.addEventListener('pointerenter', (evt: PointerEvent) => {
      if (!evt.buttons) this.activate();
    });
  }
}
