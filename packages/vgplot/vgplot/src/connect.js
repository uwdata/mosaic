import { coordinator } from '@uwdata/mosaic-core';

/**
 * Context-sensitive connector for coordinator and clients.
 * This method proxies access to Coordinator.connect().
 * If the provided context object has an explicit coordinator, that is used.
 * Otherwise the default coordinator singleton is used.
 */
export function connect(ctx, ...clients) {
  const coord = ctx?.context?.coordinator ?? coordinator();
  for (const client of clients) {
    coord.connect(client);
  }
}
