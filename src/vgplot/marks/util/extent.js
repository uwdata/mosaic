import { scaleLinear } from 'd3';

export function extentX(mark) {
  const { plot, _stats } = mark;
  const domain = plot.getAttribute('domainX');

  if (Array.isArray(domain)) {
    return domain;
  } else {
    const { column } = mark.channelField('x');
    const { min, max } = _stats.find(s => s.column === column);
    const xdom = scaleLinear().domain([ min, max ]).nice().domain();
    plot.setAttribute('domainX', xdom);
    return xdom;
  }
}

export function extentY(mark) {
  const { plot, _stats } = mark;
  const domain = plot.getAttribute('domainY');

  if (Array.isArray(domain)) {
    return domain;
  } else {
    const { column } = mark.channelField('y');
    const { min, max } = _stats.find(s => s.column === column);
    const ydom = scaleLinear().domain([ min, max ]).nice().domain();
    plot.setAttribute('domainY', ydom);
    return ydom;
  }
}
