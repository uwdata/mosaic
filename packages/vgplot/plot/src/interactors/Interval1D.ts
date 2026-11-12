import type { InteractorMark } from '../marks/Mark.js';
import { Selection, type SelectionClause } from '@uwdata/mosaic-core';
import { clauseInterval } from '@uwdata/mosaic-core';
import { ascending, min, max } from 'd3';
import { brushGroups, brushX, brushY, type WrapBrush } from './util/brush.js';
import { closeTo } from './util/close-to.js';
import { getField } from './util/get-field.js';
import { invert } from './util/invert.js';
import { sanitizeStyles } from './util/sanitize-styles.js';
import type { ScaleDomain } from '@uwdata/mosaic-sql';
import type { Extent, Interactor, SVG, ScaleName } from '../types.js';
import type * as mc from '@uwdata/mosaic-core';

export class Interval1D implements Interactor, mc.Activatable {
  mark: InteractorMark;
  channel: ScaleName;
  pixelSize: number;
  selection: Selection;
  peers: boolean;
  field: any;
  style: Record<string, string | number>;
  brush: WrapBrush;
  value?: any;
  g: any;
  scale: any;

  constructor(mark: InteractorMark, {
    channel,
    selection,
    field = undefined,
    pixelSize = 1,
    peers = true,
    brush: style = undefined
  }: { channel: ScaleName; selection: Selection; field?: string; pixelSize?: number; peers?: boolean; brush?: Record<string, string | number>; }) {
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

  publish(extent: Extent): void {
    let range: Extent | undefined = undefined;
    if (extent) {
      range = extent
        .map(v => invert(v, this.scale, this.pixelSize))
        .sort((a, b) => a - b) as Extent;
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
      //@ts-expect-error  Type 'Set<InteractorMark>' is not assignable to type 'Set<MosaicClient>'.
      clients: this.peers ? mark.plot.markSet : new Set([mark]),
      scale,
      pixelSize
    });
  }

  init(svg: SVG, root?: SVGGElement | undefined | null): void {
    const { brush, channel, style } = this;
    this.scale = svg.scale(channel);
    const range = this.value?.map(this.scale.apply).sort(ascending);
    const rx = svg.scale('x').range;
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
