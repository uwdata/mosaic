import { coordinator as _coordinator } from '@uwdata/mosaic-core';
import { NamedPlots } from './plot/named-plots.js';
import * as vgplot from './api.js';

export function createAPIContext({
  coordinator = _coordinator(),
  namedPlots = new NamedPlots,
  extensions = null,
  ...options
} = {}) {
  return {
    ...vgplot,
    ...extensions,
    context: {
      coordinator,
      namedPlots,
      ...options
    }
  };
}
