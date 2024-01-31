import { Legend } from '@uwdata/mosaic-plot';
import { requestNamedPlot } from './named-plots.js';

function legend(channel, options = {}) {
  if (options.for) {
    const { for: maybePlot, ...rest } = options;
    const legend = new Legend(channel, rest);
    const type = typeof maybePlot;
    const add = plot => plot.addLegend(legend, false);
    if (type === 'string') {
      requestNamedPlot(this, maybePlot, add);
    } else if (maybePlot.value) {
      add(maybePlot.value);
    }
    return legend.element;
  } else {
    return plot => plot.addLegend(new Legend(channel, options));
  }
}

export function colorLegend(options) {
  return legend.call(this, 'color', options);
}

export function opacityLegend(options) {
  return legend.call(this, 'opacity', options);
}

export function symbolLegend(options) {
  return legend.call(this, 'symbol', options);
}
