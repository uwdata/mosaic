import type { TestProject } from 'vitest/node';
import { target } from '../implementations/index.ts';
import { startServer } from './server.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    conformanceUrl: string;
  }
}

// Only a server is started here: a URL is the one thing that survives
// `provide()`. In-process and comm sessions are built inside the test worker
// so they can be disposed there.
export default async function setup(project: TestProject) {
  const config = target(process.env.CONFORMANCE_TARGET);
  if (config.kind !== 'server') return;
  const external = process.env.CONFORMANCE_URL;
  if (external) {
    console.log(`[conformance] testing ${config.name} at ${external} (not spawned)`);
    project.provide('conformanceUrl', external.endsWith('/') ? external : `${external}/`);
    return;
  }
  const running = await startServer(config);
  project.provide('conformanceUrl', running.url);
  return () => running.stop();
}
