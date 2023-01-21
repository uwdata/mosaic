import { scaleLinear } from 'd3';
import { Fixed, Transient } from '../../symbols.js';

export function plotExtent(mark, channel, name) {
  const { plot, stats, filterBy } = mark;
  const domain = plot.getAttribute(name);

  if (Array.isArray(domain) && !domain[Transient]) {
    return domain;
  } else {
    const { column } = mark.channelField(channel);
    const { min, max } = stats.find(s => s.column === column);
    const filter = filterBy?.predicate(mark) || [];
    // TODO: more robust range extraction (check against column)
    const dom = filter[filter.length-1]?.value?.slice() ||
      scaleLinear().domain([ min, max ]).nice().domain();
    if (domain !== Fixed) dom[Transient] = true;
    plot.setAttribute(name, dom);
    return dom;
  }
}

export function extentX(mark) {
  return plotExtent(mark, 'x', 'domainX');
}

export function extentY(mark) {
  return plotExtent(mark, 'y', 'domainY');
}
