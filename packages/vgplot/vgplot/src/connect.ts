import { coordinator, type MosaicClient } from '@uwdata/mosaic-core';
import type { APIContext } from './context.js';

/**
 * Context-sensitive connector for coordinator and clients.
 * This method proxies access to Coordinator.connect().
 * If the provided context object has an explicit coordinator, that is used.
 * Otherwise the default coordinator singleton is used.
 */
export function connect(ctx: APIContext, ...clients: MosaicClient[]): void {
  const coord = ctx?.context?.coordinator ?? coordinator();
  for (const client of clients) {
    coord.connect(client);
  }
}
