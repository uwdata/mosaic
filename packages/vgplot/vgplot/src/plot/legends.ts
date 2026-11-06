import type * as mc from '@uwdata/mosaic-core'
import { Legend } from '@uwdata/mosaic-plot';
import type { Plot } from '@uwdata/mosaic-plot';
import { requestNamedPlot } from './named-plots.js';

interface PlotLegendOptions {
  as?: mc.Param<unknown>;
  field?: string;
  label?: string;
  tickSize?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  width?: number;
  height?: number;
  columns?: number;
}

interface LegendOptions extends PlotLegendOptions {
  for: string;
}

type Options = PlotLegendOptions | LegendOptions;

function legend(channel: 'color' | 'opacity' | 'symbol', options: Options = {}): HTMLDivElement | ((plot: Plot) => void) {
  if ('for' in options) {
    const { for: maybePlot, ...rest } = options;
    const legend = new Legend(channel, rest);
    if (!(typeof maybePlot === 'string')) {
      throw new TypeError(`Unrecognized 'for' type: ${typeof maybePlot}`)
    }
    requestNamedPlot(this, maybePlot, (plot) => plot.addLegend(legend, false));
    return legend.element;
  }
  return (plot: Plot): void => plot.addLegend(new Legend(channel, options));
}

export function colorLegend(options: Options): ReturnType<typeof legend> {
  return legend.call(this, 'color', options);
}

export function opacityLegend(options: Options): ReturnType<typeof legend> {
  return legend.call(this, 'opacity', options);
}

export function symbolLegend(options: Options): ReturnType<typeof legend> {
  return legend.call(this, 'symbol', options);
}
