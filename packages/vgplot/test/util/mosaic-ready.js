import { MosaicClient } from '@uwdata/mosaic-core';
import { Plot } from '@uwdata/mosaic-plot';

/**
 * Return a Promise that resolves when a rendered vgplot spec is
 * has completed rendering.
 * @param {HTMLElement} el The root element of the rendered spec.
 * @returns {Promise<any>}
 */
export function mosaicReady(el) {
  const promises = [];
  const queue = [el];
  while (queue.length) {
    const node = queue.shift();
    const value = node.value;
    if (isClient(value)) {
      // TODO: find general way to determine if client is pending...
    } else if (isPlot(value)) {
      promises.push(value.update());
    } else {
      queue.push(...node.children);
    }
  }

  return Promise.allSettled(promises);
}

function isClient(value) {
  return value instanceof MosaicClient;
}

function isPlot(value) {
  return value instanceof Plot;
}
