import type { Coordinator, Param, Selection } from '@uwdata/mosaic-core';
import { createAPIContext, loadExtension } from '@uwdata/vgplot';

import type { SpecNode } from './ast/SpecNode.js';
import { resolveExtensions } from './config/extensions.js';
import { error } from './util.js';

type APIContext = ReturnType<typeof createAPIContext>;

/**
 * Generate a running web application (DOM content) for a Mosaic spec AST.
 *
 * @param ast Mosaic AST root node.
 * @param options Instantiation options.
 * @returns A Promise to an object with the resulting DOM element, and a map of named parameters
 *   (Param and Selection instances).
 */
export async function astToDOM(
  ast: SpecNode,
  options: ConstructorParameters<typeof InstantiateContext>[0] = {},
): Promise<{
  element: HTMLElement | SVGSVGElement;
  params: Map<string, Param<unknown> | Selection>;
}> {
  const { data, params, plotDefaults } = ast;
  // oxlint-disable-next-line no-use-before-define
  const ctx = new InstantiateContext({ plotDefaults, ...options });

  const queries: string[] = [];

  // Process database extensions
  const exts = resolveExtensions(ast);
  queries.push(...[...exts].map((name) => loadExtension(name)));

  // Process data definitions
  for (const node of Object.values(data)) {
    const query = node.instantiate(ctx);
    if (query) {
      queries.push(query);
    }
  }

  // Perform extension and data loading, if needed
  if (queries.length > 0) {
    await ctx.coordinator.exec(queries);
  }

  // Process param/selection definitions
  // Skip definitions with names already defined
  for (const [name, node] of Object.entries(params)) {
    if (!ctx.activeParams.has(name)) {
      const param = node.instantiate(ctx);
      ctx.activeParams.set(name, param);
    }
  }

  return {
    element: ast.root.instantiate(ctx),
    params: ctx.activeParams,
  };
}

interface InstantiateContextOptions {
  api: APIContext;
  baseURL: string | null;
  params: Map<string, Param<unknown> | Selection>;
  // oxlint-disable-next-line typescript/no-explicit-any
  plotDefaults: any[];
}

export class InstantiateContext {
  coordinator: Coordinator;
  activeParams: Map<string, Param<unknown> | Selection>;
  api: APIContext;
  plotDefaults: unknown[];
  baseURL: string | null;
  /**
   * Create a new InstantiateContext instance.
   *
   * @param options Optional instantiation options.
   * @param [options.baseURL] The base URL for loading data files.
   * @param [options.plotDefaults] Array of default plot attributes.
   * @param [options.params] A map of predefined Params/Selections.
   * @param [options.api] The context to be used for vgplot API methods.
   */
  constructor({
    api = createAPIContext(),
    plotDefaults = [],
    params = new Map(),
    // oxlint-disable-next-line unicorn/no-null
    baseURL = null,
  }: Partial<InstantiateContextOptions> = {}) {
    this.api = api;
    this.plotDefaults = plotDefaults;
    this.activeParams = params;
    this.baseURL = baseURL;
    this.coordinator = api.context.coordinator;
  }

  // oxlint-disable-next-line class-methods-use-this
  error(message: string, data: unknown): never {
    error(message, data);
  }
}
