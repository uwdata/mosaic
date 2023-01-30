import { Legend } from '../legend.js';

function legend(channel, options) {
  return plot => {
    plot.addLegend(new Legend(plot, channel, options));
  };
}


export const legendColor = options => legend('color', options);
export const legendOpacity = options => legend('opacity', options);
