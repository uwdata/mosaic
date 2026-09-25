import type { TestProject } from 'vitest/node';
import { serverConfig } from '../servers/index.ts';
import { startServer } from './server.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    conformanceUrl: string;
  }
}

export default async function setup(project: TestProject) {
  const config = serverConfig(process.env.CONFORMANCE_SERVER);
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
