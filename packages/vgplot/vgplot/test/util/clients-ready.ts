import { MosaicClient } from '@uwdata/mosaic-core';
import { Plot } from '@uwdata/mosaic-plot';

type RootElement = HTMLElement & { value: MosaicClient | Plot };

function extractClients(el: RootElement | HTMLElement): MosaicClient[] {
  const clients: MosaicClient[] = [];
  const queue: (RootElement | Element)[] = [el];
  while (queue.length) {
    const node = queue.shift();
    if ('value' in node) {
      const value = node.value;
      if (value instanceof MosaicClient) {
        clients.push(value);
      } else if (value instanceof Plot) {
        clients.push(...value.marks);
      } else {
        queue.push(...node.children);
      }
    } else {
      queue.push(...node.children);
    }
  }
  return clients;
}

/**
 * Return a Promise that resolves when all plots in an
 * instantiated vgplot context have completed rendering.
 * @param el The root element of the rendered spec.
 */
export function clientsReady(el: RootElement | HTMLElement): Promise<any> {
  const clients = extractClients(el);
  return Promise.allSettled(clients.map(c => c.pending));
}
