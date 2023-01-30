import { Legend } from '../legend.js';

function legend(channel, options = {}) {
  if (options.for) {
    const { for: maybePlot, ...rest } = options;
    const plot = maybePlot.value || null;
    const legend = new Legend(channel, rest);
    if (plot) plot.addLegend(legend, false);
    return legend.element;
  } else {
    return plot => plot.addLegend(new Legend(channel, options));
  }
}

export const legendColor = options => legend('color', options);
export const legendOpacity = options => legend('opacity', options);
