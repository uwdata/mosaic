import type * as mc from '@uwdata/mosaic-core'
import { Legend } from '@uwdata/mosaic-plot';
import { requestNamedPlot } from './named-plots.js';
import type { Callback, Plot } from './types.js';

interface LegendOptions {
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

interface LegendForOptions extends LegendOptions {
  for: string;
}

type Options = LegendOptions | LegendForOptions;


// TODO @dangotbanned: `options` might be expressible as a conditional type
function legend(channel: 'color' | 'opacity' | 'symbol', options: LegendForOptions): HTMLDivElement
function legend(channel: 'color' | 'opacity' | 'symbol', options: LegendOptions): Callback
function legend(channel: 'color' | 'opacity' | 'symbol', options: Options = {}): HTMLDivElement | Callback {
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

export function colorLegend(options: LegendForOptions): HTMLDivElement
export function colorLegend(options?: LegendOptions): Callback
export function colorLegend(options: Options = {}): HTMLDivElement | Callback {
  return legend.call(this, 'color', options);
}

export function opacityLegend(options: LegendForOptions): HTMLDivElement
export function opacityLegend(options?: LegendOptions): Callback
export function opacityLegend(options: Options = {}): HTMLDivElement | Callback {
  return legend.call(this, 'opacity', options);
}

export function symbolLegend(options: LegendForOptions): HTMLDivElement
export function symbolLegend(options?: LegendOptions): Callback
export function symbolLegend(options: Options = {}): HTMLDivElement | Callback {
  return legend.call(this, 'symbol', options);
}
