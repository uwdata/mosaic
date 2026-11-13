// @vitest-environment jsdom
import { expect, describe, it } from 'vitest';
import { resolve } from 'node:path';
import { Coordinator } from '@uwdata/mosaic-core';
import { createAPIContext } from '../src/index.js';
import { clientsReady } from './util/clients-ready.js';
import { NodeConnector } from '@uwdata/mosaic-core/node-connector';
import type { APIContext } from '../src/context.js';

interface TestModule {
  default(vg: APIContext): Promise<HTMLElement>;
}

const cwd = import.meta.dirname;

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

async function renderTest(name: string): Promise<void> {
  const specPath = resolve(cwd, `specs/${name}.js`);
  const htmlPath = resolve(cwd, `output/${name}.html`);
  const { default: run } = (await import(specPath)) as TestModule;
  const mc = new Coordinator(await NodeConnector.make(), { logger: null });
  const el = await run(createAPIContext({ coordinator: mc }));
  await clientsReady(el);
  await expect(el.outerHTML).toMatchFileSnapshot(htmlPath);
}
