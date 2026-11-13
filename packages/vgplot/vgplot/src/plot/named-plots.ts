import type { PlotDirective, Plot } from './types.js';

export class NamedPlots extends Map<string, Plot> {
  private waiting: Map<string, PlotDirective[]>;

  constructor(iterable?: Iterable<readonly [string, Plot]> | null) {
    super(iterable)
    this.waiting = new Map
  }

  request(name: string, callback: PlotDirective): void {
    let plot: Plot | undefined;
    if ((plot = this.get(name))) {
      callback(plot);
    } else {
      const waiting = this.waiting;
      const list = waiting.get(name) ?? [];
      waiting.set(name, list.concat(callback));
    }
  }
  set(name: string, plot: Plot): this {
    if (this.has(name)) {
      console.warn(`Overwriting named plot "${name}".`);
    }
    const { waiting } = this;
    let old: PlotDirective[] | undefined;
    if ((old = waiting.get(name))) {
      old.forEach(fn => fn(plot));
      waiting.delete(name);
    }
    return super.set(name, plot);
  }
  clear(): void {
    this.waiting.clear();
    return super.clear();
  }
}

/**
 * Default instance of named plots map.
 */
export const namedPlots = new NamedPlots();

type Context = { context?: { namedPlots?: NamedPlots } };

/**
 * Context-sensitive lookup of named plots.
 * This method proxies access to the NamedPlots.request().
 * If the provided context object has a local namedPlots, that is used.
 * Otherwise the default instance is used.
 */
export function requestNamedPlot(ctx: Context, name: string, callback: PlotDirective): void {
  const map = ctx?.context?.namedPlots ?? namedPlots;
  map.request(name, callback);
}

/**
 * Context-sensitive addition of named plots.
 * This method proxies access to the NamedPlots.set().
 * If the provided context object has a local namedPlots, that is used.
 * Otherwise the default instance is used.
 */
export function setNamedPlot(ctx: Context, name: string, plot: Plot): void {
  const map = ctx?.context?.namedPlots ?? namedPlots;
  map.set(name, plot);
}
