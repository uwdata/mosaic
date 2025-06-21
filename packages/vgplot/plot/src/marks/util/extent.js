import { scaleLinear } from 'd3';
import { Fixed, Transient } from '../../symbols.js';
import { BetweenOpNode, walk } from '@uwdata/mosaic-sql';

export const xext = { x: ['min', 'max'] };
export const yext = { y: ['min', 'max'] };
export const xyext = { ...xext, ...yext };

export function plotExtent(mark, filter, channel, domainAttr, niceAttr) {
  const { plot } = mark;
  const domain = plot.getAttribute(domainAttr);
  const nice = plot.getAttribute(niceAttr);

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

export function extentX(mark, filter) {
  return plotExtent(mark, filter, 'x', 'xDomain', 'xNice');
}

export function extentY(mark, filter) {
  return plotExtent(mark, filter, 'y', 'yDomain', 'yNice');
}

export function filteredExtent(filter, column) {
  if (!filter) return;

  let lo;
  let hi;

  [filter].flat().forEach(p => walk(p, (node) => {
    if (node instanceof BetweenOpNode && `${node.expr}` === column) {
      // @ts-ignore
      const extent = (node.extent ?? []).map(v => v?.value ?? v);
      if (lo == null || extent[0] < lo) lo = extent[0];
      if (hi == null || extent[1] > hi) hi = extent[1];
    }
  }));

  return lo != null && hi != null && lo !== hi ? [lo, hi] : undefined;
}
