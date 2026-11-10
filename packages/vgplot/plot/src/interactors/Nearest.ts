import { Selection, Param } from '@uwdata/mosaic-core';
import { InteractorMark } from '../marks/Mark.js';
import { clauseList, clausePoint, clausePoints, isSelection } from '@uwdata/mosaic-core';
import { select, pointer, min } from 'd3';
import { getField } from './util/get-field.js';
import type { ChannelName, Interactor, SVG } from '../types.js';
import type * as mc from '@uwdata/mosaic-core';
import type { ScaleName } from '@observablehq/plot';



export class Nearest implements Interactor, mc.Activatable {
  mark: InteractorMark;
  selection: Selection | Param<any>;
  clients: Set<InteractorMark>;
  pointer?: 'x' | 'y' | 'xy';
  listMatch?: 'any' | 'all';
  channels: ChannelName[];
  fields: string[];
  maxRadius: number;
  valueIndex: number;

  constructor(mark: InteractorMark, {
    selection,
    pointer,
    channels = undefined,
    fields = undefined,
    maxRadius = 40,
    listMatch = undefined
  }: { selection: Selection | Param<any>; pointer: 'x' | 'y' | 'xy'; channels?: ChannelName[]; fields?: string[]; maxRadius?: number; listMatch?: 'any' | 'all'; }) {
    this.mark = mark;
    this.selection = selection;
    this.clients = new Set([mark]);
    this.pointer = pointer;
    this.listMatch = listMatch;
    this.channels = channels || (
      pointer === 'x' ? ['x'] : pointer === 'y' ? ['y'] : ['x', 'y']
    );
    this.fields = fields || this.channels.map(c => getField(mark, [c]));
    this.maxRadius = maxRadius;
    this.valueIndex = -1;
  }

  clause(value: any[]): mc.SelectionClause {
    const { clients, fields, mark } = this;
    const opt = { source: (this), clients };
    if (fields.length === 1) {
      // unnested field: use a list-membership predicate instead of point equality
      if (mark.isUnnested(fields[0])) {
        const list = value != null ? [value[0]] : undefined;
        //@ts-expect-error `this` is bad
        return clauseList(fields[0], list, { ...opt, listMatch: this.listMatch });
      }
      // if only one field, use a simpler clause that passes the value
      // this allows a single field selection value to act like a param
      //@ts-expect-error `this` is bad
      return clausePoint(fields[0], value?.[0], opt);
    }
    //@ts-expect-error `this` is bad
    return clausePoints(fields, value ? [value] : value, opt);
  }

  init(svg: SVG): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const { mark, channels, selection, maxRadius } = this;
    const columns = mark.data && 'columns' in mark.data ? mark.data.columns : {};
    const keys = channels.map(c => mark.channelField(c).as);
    const param = !isSelection(selection);

    // extract x, y coordinates for data values and determine scale factors
    const [X, Y] = calculateXY(svg, mark);
    const sx = this.pointer === 'y' ? 0.01 : 1;
    const sy = this.pointer === 'x' ? 0.01 : 1;

    const root = select(svg);

    // find value nearest to pointer and update param or selection
    // we don't pass undefined values to params, but do allow empty selections
    root.on('pointerenter pointerdown pointermove', function (evt) {
      const [px, py] = pointer(evt, this);
      const i = findNearest(X, Y, px, py, sx, sy, maxRadius);
      // @ts-expect-error Property 'valueIndex' does not exist on type 'SVGSVGElement & Plot'.
      if (i !== this.valueIndex) {
        // @ts-expect-error Property 'valueIndex' does not exist on type 'SVGSVGElement & Plot'.
        this.valueIndex = i;
        const v = i < 0 ? undefined : keys.map(k => columns[k][i]);
        selection.update(
          // provide value for param, clause for selection
          // @ts-expect-error Argument of type 'unknown' is not assignable to parameter of type 'SelectionClause'.
          param ? (!v || v.length > 1 ? v : v[0]) : that.clause(v)
        );
      }
    });

    // if not a selection, we're done
    if (param) return;

    // clear selection upon pointer exit
    root.on('pointerleave', () => {
      selection.update(that.clause(undefined));
    });

    // trigger activation updates
    svg.addEventListener('pointerenter', evt => {
      //@ts-expect-error Property 'buttons' does not exist on type 'Event'.
      if (!evt.buttons) this.activate();
    });
  }

  activate(): void {
    const v = this.channels.map(() => 0);
    //@ts-expect-error  Property 'activate' does not exist on type 'Param<any>'
    this.selection.activate(this.clause(v));
  }
}

/**
 * Extract x, y coordinates for data values.
 */
function calculateXY(svg: SVG, mark: InteractorMark): number[][] {
  //@ts-expect-error Property 'columns' does not exist on type 'DataColumns'.
  const { data: { columns } } = mark;
  const data = (c: ChannelName) => columns[mark.channelField(c)?.as];
  const scale = (c: ScaleName) => svg.scale(c);

  const sx = svg.scale('x');
  const sy = svg.scale('y');
  const sfx = scale('fx')?.apply;
  const sfy = scale('fy')?.apply;

  const X: number[] = Array.from(data('x'), sx.apply);
  const Y: number[] = Array.from(data('y'), sy.apply);

  // as needed, adjust coordinates by facets
  if (sfx) {
    const dx = min(sx.range);
    const FX = data('fx');
    for (let i = 0; i < FX.length; ++i) {
      X[i] += sfx(FX[i]) - dx;
    }
  }
  if (sfy) {
    const dy = min(sy.range);
    const FY = data('fy');
    for (let i = 0; i < FY.length; ++i) {
      Y[i] += sfy(FY[i]) - dy;
    }
  }

  return [X, Y];
}

/**
 * Find the nearest data point to the pointer. The nearest point
 * is found via Euclidean distance, but with scale factors *sx* and
 * *sy* applied to the x and y distances. For example, to prioritize
 * selection along the x-axis, use *sx* = 1, *sy* = 0.01.
 * @param x Array of data point x coordinate values.
 * @param y Array of data point y coordinate values.
 * @param px The x coordinate of the pointer.
 * @param py The y coordinate of the pointer.
 * @param sx A scale factor for x coordinate spans.
 * @param sy A scale factor for y coordinate spans.
 * @param maxRadius The maximum pointer distance for selection.
 * @returns An integer index into the data array corresponding
 *  to the nearest data point, or -1 if no nearest point is found.
 */
function findNearest(x: number[], y: number[], px: number, py: number, sx: number, sy: number, maxRadius: number): number {
  let dist = maxRadius * maxRadius;
  let nearest = -1;
  for (let i = 0; i < x.length; ++i) {
    const dx = sx * (x[i] - px);
    const dy = sy * (y[i] - py);
    const dd = dx * dx + dy * dy;
    if (dd <= dist) {
      dist = dd;
      nearest = i;
    }
  }
  return nearest;
}
