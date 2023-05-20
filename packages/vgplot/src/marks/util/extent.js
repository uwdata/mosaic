import { scaleLinear } from 'd3';
import { Fixed, Transient } from '../../symbols.js';

export const xext = { x: ['min', 'max'] };
export const yext = { y: ['min', 'max'] };
export const xyext = { ...xext, ...yext };

export function plotExtent(mark, filter, channel, domainAttr, niceAttr) {
  const { plot, stats } = mark;
  const domain = plot.getAttribute(domainAttr);
  const nice = plot.getAttribute(niceAttr);

  if (Array.isArray(domain) && !domain[Transient]) {
    return domain;
  } else {
    const { field } = mark.channelField(channel);
    const { column } = field;
    const { min, max } = stats[column];
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
  const visitor = (type, clause) => {
    if (type === 'BETWEEN' && clause.field.column === column) {
      const { range } = clause;
      if (range && (lo == null || range[0] < lo)) lo = range[0];
      if (range && (hi == null || range[1] > hi)) hi = range[1];
    }
  };

  if (Array.isArray(filter)) {
    filter.forEach(p => p.visit?.(visitor));
  } else if (filter.visit) {
    filter.visit(visitor);
  }

  return lo != null && hi != null && lo !== hi ? [lo, hi] : undefined;
}
