import type * as mc from '@uwdata/mosaic-core'
import { Legend } from '@uwdata/mosaic-plot';
import { requestNamedPlot } from './named-plots.js';
import type { PlotDirective, Plot } from './types.js';
import type { APIContext } from '../context.js';

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
function legend(this: ThisType<APIContext>, channel: 'color' | 'opacity' | 'symbol', options: LegendForOptions): HTMLDivElement
function legend(this: ThisType<APIContext>, channel: 'color' | 'opacity' | 'symbol', options: LegendOptions): PlotDirective
function legend(this: ThisType<APIContext>, channel: 'color' | 'opacity' | 'symbol', options: Options = {}): HTMLDivElement | PlotDirective {
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

export function colorLegend(this: ThisType<APIContext>, options: LegendForOptions): HTMLDivElement
export function colorLegend(this: ThisType<APIContext>, options?: LegendOptions): PlotDirective
export function colorLegend(this: ThisType<APIContext>, options: Options = {}): HTMLDivElement | PlotDirective {
  return legend.call(this, 'color', options);
}

export function opacityLegend(this: ThisType<APIContext>, options: LegendForOptions): HTMLDivElement
export function opacityLegend(this: ThisType<APIContext>, options?: LegendOptions): PlotDirective
export function opacityLegend(this: ThisType<APIContext>, options: Options = {}): HTMLDivElement | PlotDirective {
  return legend.call(this, 'opacity', options);
}

export function symbolLegend(this: ThisType<APIContext>, options: LegendForOptions): HTMLDivElement
export function symbolLegend(this: ThisType<APIContext>, options?: LegendOptions): PlotDirective
export function symbolLegend(this: ThisType<APIContext>, options: Options = {}): HTMLDivElement | PlotDirective {
  return legend.call(this, 'symbol', options);
}
