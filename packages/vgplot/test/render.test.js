import { beforeEach, afterEach, expect, describe, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Coordinator } from '@uwdata/mosaic-core';
import { JSDOM } from 'jsdom';
import { nodeConnector } from './util/node-connector.js';
import { createAPIContext } from '../src/index.js';
import { mosaicReady } from './util/mosaic-ready.js';

const cwd = import.meta.dirname;

beforeEach(() => {
  const dom = new JSDOM(
    `<!DOCTYPE html><body></body>`,
    { pretendToBeVisual: true }
  );

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
});

async function renderTest(name) {
  const specPath = resolve(cwd, `specs/${name}.js`);
  const htmlPath = resolve(cwd, `output/${name}.html`);
  const expected = await readFile(htmlPath, { encoding: 'utf8'});
  const run = (await import(specPath)).default;
  const el = await run(vg());
  await mosaicReady(el);
  expect(el.outerHTML).toEqual(expected);
}

function vg() {
  return createAPIContext({
    coordinator: new Coordinator(nodeConnector(), { logger: null })
  });
}
