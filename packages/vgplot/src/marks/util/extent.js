import { scaleLinear } from 'd3';
import { Fixed, Transient } from '../../symbols.js';

export function plotExtent(mark, filter, channel, domainAttr, niceAttr) {
  const { plot, stats } = mark;
  const domain = plot.getAttribute(domainAttr);
  const nice = plot.getAttribute(niceAttr) ?? true;

  if (Array.isArray(domain) && !domain[Transient]) {
    return domain;
  } else {
    const { column } = mark.channelField(channel);
    const { min, max } = stats.find(s => s.column === column);
    const dom = filteredExtent(filter, column) ||
      scaleLinear().domain([ min, max ]).nice(nice).domain();
    if (domain !== Fixed) dom[Transient] = true;
    plot.setAttribute(domainAttr, dom);
    return dom;
  }
}

export function extentX(mark, filter) {
  return plotExtent(mark, filter, 'x', 'domainX', 'niceX');
}

export function extentY(mark, filter) {
  return plotExtent(mark, filter, 'y', 'domainY', 'niceY');
}

export function filteredExtent(filter, column) {
  if (!filter) return;

  let lo;
  let hi;
  const visitor = (type, clause) => {
    if (type === 'BETWEEN' && clause.expr.column === column) {
      const { value } = clause;
      if (value && (lo == null || value[0] < lo)) lo = value[0];
      if (value && (hi == null || value[1] > hi)) hi = value[1];
    }
  };

  if (Array.isArray(filter)) {
    filter.forEach(p => p.visit?.(visitor));
  } else if (filter.visit) {
    filter.visit(visitor);
  }

  return lo != null && hi != null && lo !== hi ? [lo, hi] : undefined;
}
