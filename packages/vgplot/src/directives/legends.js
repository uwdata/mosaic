import { Legend } from '../legend.js';
import { namedPlots } from './plot.js';

function legend(channel, options = {}) {
  if (options.for) {
    const { for: maybePlot, ...rest } = options;
    const legend = new Legend(channel, rest);
    const type = typeof maybePlot;
    const add = plot => plot.addLegend(legend, false);
    if (type === 'string') {
      namedPlots.request(maybePlot, add);
    } else if (maybePlot.value) {
      add(maybePlot.value);
    }
    return legend.element;
  } else {
    return plot => plot.addLegend(new Legend(channel, options));
  }
}

export const legendColor = options => legend('color', options);
export const legendOpacity = options => legend('opacity', options);
export const legendSymbol = options => legend('symbol', options);
