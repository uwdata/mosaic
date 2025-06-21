import { beforeEach, afterEach, expect, describe, it } from 'vitest';
import { resolve } from 'node:path';
import { Coordinator } from '@uwdata/mosaic-core';
import { JSDOM } from 'jsdom';
import { nodeConnector } from './util/node-connector.js';
import { createAPIContext } from '../src/index.js';
import { clientsReady } from './util/clients-ready.js';

const cwd = import.meta.dirname;

beforeEach(() => {
  const dom = new JSDOM(
    `<!DOCTYPE html><body></body>`,
    { pretendToBeVisual: true }
  );

  // assign browser environment globals
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.navigator ??= dom.window.navigator;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
});

afterEach(() => {
  // remove browser environment globals
  delete globalThis.requestAnimationFrame;
  if (globalThis.navigator === globalThis.window.navigator) {
    delete globalThis.navigator;
  }
  delete globalThis.document;
  delete globalThis.window;
});

describe('render', () => {
  it('should render the density1d spec', () => {
    return renderTest('density1d');
  });
  it('should render the airline-travelers spec', () => {
    return renderTest('airline-travelers');
  });
  it('should render the weather spec', () => {
    return renderTest('weather');
  });
});

async function renderTest(name) {
  const specPath = resolve(cwd, `specs/${name}.js`);
  const htmlPath = resolve(cwd, `output/${name}.html`);
  const { default: run } = await import(specPath);
  const mc = new Coordinator(nodeConnector(), { logger: null });
  const el = await run(createAPIContext({ coordinator: mc }));
  await clientsReady(el);
  await expect(el.outerHTML).toMatchFileSnapshot(htmlPath);
}
