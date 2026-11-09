import { MosaicClient } from '@uwdata/mosaic-core';
import { Plot } from '@uwdata/mosaic-plot';
import type { types } from '@uwdata/vgplot';

function extractClients(el: types.RootElement | HTMLElement): MosaicClient[] {
  const clients: MosaicClient[] = [];
  const queue: (types.RootElement | Element)[] = [el];
  let node: Element | types.RootElement | undefined;
  while ((node = queue.shift())) {
    if ('value' in node) {
      const value = node.value;
      if (value instanceof MosaicClient) {
        clients.push(value);
        continue;
      } else if (value instanceof Plot) {
        clients.push(...value.marks);
        continue;
      }
    }
    queue.push(...node.children);
  }
  return clients;
}

/**
 * Return a Promise that resolves when all plots in an
 * instantiated vgplot context have completed rendering.
 * @param el The root element of the rendered spec.
 */
export function clientsReady(el: types.RootElement | HTMLElement): Promise<any> {
  const clients = extractClients(el);
  return Promise.allSettled(clients.map(c => c.pending));
}
