import { coordinator as _coordinator, Coordinator } from '@uwdata/mosaic-core';
import { NamedPlots } from './plot/named-plots.js';
import * as vgplot from './api.js';

type VgPlot = typeof vgplot;
type Extensions = Record<string, unknown>;
interface Options {
  coordinator?: Coordinator;
  namedPlots?: NamedPlots;
  extensions?: Extensions;
}

interface Context extends Record<string, unknown> {
  coordinator: Coordinator;
  namedPlots: NamedPlots;
}

type APIContext = VgPlot & Extensions & { coordinator: () => Coordinator; context: Context };

export function createAPIContext({
  coordinator = _coordinator(),
  namedPlots = new NamedPlots(),
  extensions = {},
  ...options
}: Options = {}): APIContext {
  return {
    ...vgplot,
    ...extensions,
    coordinator: () => coordinator,
    context: {
      coordinator,
      namedPlots,
      ...options,
    },
  };
}
