import { scaleLinear } from 'd3';
import { Fixed, Transient } from '../../symbols.js';
import { BetweenOpNode, walk } from '@uwdata/mosaic-sql';
import type { Mark } from '../Mark.js';
import type * as msql from '@uwdata/mosaic-sql';
import type { FixedType } from '../../types.js';

export const xext = { x: ['min', 'max'] } as const;
export const yext = { y: ['min', 'max'] } as const;
/** TODO @dangotbanned Investigate shared state `xyext`
 *
 * - appears to be shared by all *instances* of `Grid2DMark` & `HexbinMark`.
 * - Passed to `Mark.reqs`, which is not `readonly`
 */
export const xyext = { ...xext, ...yext } as const;

// TODO @dangotbanned: Remove `{domain,nice}Attr`, `extentX`, `extentY` and replace all calls with `plotExtent(mark, filter, 'x' | 'y')
export function plotExtent(mark: Mark, filter: msql.FilterExpr, channel: 'x' | 'y', domainAttr: 'xDomain' | 'yDomain', niceAttr: 'xNice' | 'yNice'): any[] {
  const { plot } = mark;
  const domain: any[] | FixedType | undefined = plot.getAttribute(domainAttr);
  const nice: boolean | string | number | undefined = plot.getAttribute(niceAttr);

  if (Array.isArray(domain) && !domain[Transient]) {
    return domain;
  } else {
    const { column, min, max } = mark.channelField(channel);
    const dom = filteredExtent(filter, column) || (nice
      ? scaleLinear().domain([min, max]).nice().domain()
      : [min, max]);
    if (domain !== Fixed) dom[Transient] = true;
    plot.setAttribute(domainAttr, dom, { silent: true });
    return dom;
  }
}

export function extentX(mark: Mark, filter: msql.FilterExpr): any[] {
  return plotExtent(mark, filter, 'x', 'xDomain', 'xNice');
}

export function extentY(mark: Mark, filter: msql.FilterExpr): any[] {
  return plotExtent(mark, filter, 'y', 'yDomain', 'yNice');
}

export function filteredExtent(filter: msql.FilterExpr, column: any): any[] | undefined {
  if (!filter) return;

  let lo;
  let hi;
  const field = `${column}`;

  [filter].flat().forEach(p => walk(p, (node) => {
    if (node instanceof BetweenOpNode && `${node.expr}` === field) {
      // @ts-ignore
      const extent = (node.extent ?? []).map(v => v?.value ?? v);
      if (lo == null || extent[0] < lo) lo = extent[0];
      if (hi == null || extent[1] > hi) hi = extent[1];
    }
  }));

  return lo != null && hi != null && lo.valueOf() !== hi.valueOf()
    ? [lo, hi]
    : undefined;
}
