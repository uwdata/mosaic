import { MosaicClient } from '@uwdata/mosaic-core';
import { Plot } from '@uwdata/mosaic-plot';

/**
 * Extract Mosaic clients from a DOM subtree.
 * @param {HTMLElement} el The root element to search for clients.
 * @returns {MosaicClient[]}
 */
function extractClients(el) {
  const clients = [];
  const queue = [el];
  while (queue.length) {
    const node = queue.shift();
    const value = node.value;
    if (value instanceof MosaicClient) {
      clients.push(value);
    } else if (value instanceof Plot) {
      clients.push(...value.marks);
    } else {
      queue.push(...node.children);
    }
  }
  return clients;
}

/**
 * Return a Promise that resolves when all plots in an
 * instantiated vgplot context have completed rendering.
 * @param {HTMLElement} el The root element of the rendered spec.
 * @returns {Promise<any>}
 */
export function clientsReady(el) {
  const clients = extractClients(el);
  return Promise.allSettled(clients.map(c => c.pending));
}
