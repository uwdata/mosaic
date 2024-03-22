export class NamedPlots extends Map {
  request(name, callback) {
    if (this.has(name)) {
      callback(this.get(name));
    } else {
      const waiting = this.waiting || (this.waiting = new Map);
      const list = waiting.get(name) || [];
      waiting.set(name, list.concat(callback));
    }
  }
  set(name, plot) {
    if (this.has(name)) {
      console.warn(`Overwriting named plot "${name}".`);
    }
    const { waiting } = this;
    if (waiting?.has(name)) {
      waiting.get(name).forEach(fn => fn(plot));
      waiting.delete(name);
    }
    return super.set(name, plot);
  }
  clear() {
    this.waiting?.clear();
    return super.clear();
  }
}

/**
 * Default instance of named plots map.
 */
export const namedPlots = new NamedPlots();

/**
 * Context-sensitive lookup of named plots.
 * This method proxies access to the NamedPlots.request().
 * If the provided context object has a local namedPlots, that is used.
 * Otherwise the default instance is used.
 */
export function requestNamedPlot(ctx, name, callback) {
  const map = ctx?.context?.namedPlots ?? namedPlots;
  map.request(name, callback);
}

/**
 * Context-sensitive addition of named plots.
 * This method proxies access to the NamedPlots.set().
 * If the provided context object has a local namedPlots, that is used.
 * Otherwise the default instance is used.
 */
export function setNamedPlot(ctx, name, plot) {
  const map = ctx?.context?.namedPlots ?? namedPlots;
  map.set(name, plot);
}
