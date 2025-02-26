import { Param, Selection } from '@uwdata/mosaic-core';
import { createAPIContext, loadExtension } from '@uwdata/vgplot';
import { SpecNode } from './ast/SpecNode.js';
import { resolveExtensions } from './config/extensions.js';
import { error } from './util.js';

/**
 * Generate a running web application (DOM content) for a Mosaic spec AST.
 * @param {SpecNode} ast Mosaic AST root node.
 * @param {ConstructorParameters<typeof InstantiateContext>[0]} [options] Instantiation options.
 * @returns {Promise<{
 *   element: HTMLElement | SVGSVGElement;
*    params: Map<string, Param | Selection>;
*  }>} A Promise to an object with the resulting
 *  DOM element, and a map of named parameters (Param and Selection instances).
 */
export async function astToDOM(ast, options) {
  const { data, params, plotDefaults } = ast;
  const ctx = new InstantiateContext({ plotDefaults, ...options });

  const queries = [];

  // process database extensions
  const exts = resolveExtensions(ast);
  queries.push(...Array.from(exts).map(name => loadExtension(name)));

  // process data definitions
  for (const node of Object.values(data)) {
    const query = node.instantiate(ctx);
    if (query) queries.push(query);
  }

  // perform extension and data loading, if needed
  if (queries.length > 0) {
    await ctx.coordinator.exec(queries);
  }

  // process param/selection definitions
  // skip definitions with names already defined
  for (const [name, node] of Object.entries(params)) {
    if (!ctx.activeParams.has(name)) {
      const param = node.instantiate(ctx);
      ctx.activeParams.set(name, param);
    }
  }

  return {
    element: ast.root.instantiate(ctx),
    params: ctx.activeParams
  };
}

export class InstantiateContext {
  /**
   * Create a new InstantiateContext instance.
   * @param {object} options Optional instantiation options.
   * @param {string} [options.baseURL] The base URL for loading data files.
   * @param {any[]} [options.plotDefaults] Array of default plot attributes.
   * @param {Map<string, Param>} [options.params] A map of predefined Params/Selections.
   * @param {ReturnType<typeof createAPIContext>} [options.api] The context to be used for vgplot API methods.
   */
  constructor({
    api = createAPIContext(),
    plotDefaults = [],
    params = new Map,
    baseURL = null
  } = {}) {
    this.api = api;
    this.plotDefaults = plotDefaults;
    this.activeParams = params;
    this.baseURL = baseURL;
    this.coordinator = api.context.coordinator;
  }

  error(message, data) {
    error(message, data);
  }
}
