import type { InteractorMark } from '../marks/Mark.js';
import { Selection, Activatable, type SelectionClause } from '@uwdata/mosaic-core'
import { clauseInterval } from '@uwdata/mosaic-core';
import { ascending, min, max } from 'd3';
import { brushGroups, brushX, brushY } from './util/brush.js';
import { closeTo } from './util/close-to.js';
import { getField } from './util/get-field.js';
import { invert } from './util/invert.js';
import { sanitizeStyles } from './util/sanitize-styles.js';
import type { ScaleDomain } from '@uwdata/mosaic-sql';


export class Interval1D implements Activatable {
  mark: InteractorMark;
  channel: string;
  pixelSize: number;
  selection: Selection;
  peers: boolean;
  field: any;
  style: Record<string, string | number>;
  brush: any;
  value: any;
  g: any;
  scale: any

  constructor(mark: InteractorMark, {
    channel,
    selection,
    field = undefined,
    pixelSize = 1,
    peers = true,
    brush: style = undefined
  }: { channel: string; selection: Selection; field?: string; pixelSize?: number; peers?: boolean; brush?: Record<string, string | number> }) {
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

  reset(): void {
    this.value = undefined;
    if (this.g) this.brush.reset(this.g);
  }

  activate(): void {
    this.selection.activate(this.clause(this.value || [0, 1]));
  }

  publish(extent: any): void {
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

  clause(value: ScaleDomain | null | undefined): SelectionClause {
    const { mark, pixelSize, field, scale } = this;
    return clauseInterval(field, value, {
      source: this,
      clients: this.peers ? mark.plot.markSet : new Set().add(mark),
      scale,
      pixelSize
    });
  }

  init(svg: SVGElement, root: any): void {
    const { brush, channel, style } = this;
    //@ts-expect-error Property 'scale' does not exist on type 'SVGElement'.
    this.scale = svg.scale(channel);
    const range = this.value?.map(this.scale.apply).sort(ascending);
    //@ts-expect-error Property 'scale' does not exist on type 'SVGElement'.
    const rx = svg.scale('x').range;
    //@ts-expect-error Property 'scale' does not exist on type 'SVGElement'.
    const ry = svg.scale('y').range;
    brush.extent([[min(rx), min(ry)], [max(rx), max(ry)]]);
    this.g = brushGroups(svg, root, min(rx), min(ry), `interval-${channel}`)
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
