import { createAPIContext, loadExtension } from '@uwdata/vgplot';
import { SpecNode } from './ast/SpecNode.js';
import { resolveExtensions } from './config/extensions.js';
import { error } from './util.js';

/**
 * Generate running web application (DOM content) for a Mosaic spec AST.
 * @param {SpecNode} ast Mosaic AST root node.
 * @param {object} [options] Instantiation options.
 * @param {string} [options.baseURL] The base URL for loading data files.
 * @returns {object} An object with the resulting DOM element, and
 *   a map of named parameters (Param and Selection instances).
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
  for (const [name, node] of Object.entries(params)) {
    const param = node.instantiate(ctx);
    ctx.activeParams.set(name, param);
  }

  return {
    element: ast.root.instantiate(ctx),
    params: ctx.activeParams
  };
}

export class InstantiateContext {
  constructor({
    api = createAPIContext(),
    plotDefaults = [],
    activeParams = new Map,
    baseURL = null,
    baseClientURL = baseURL,
    fetch = (...args) => window.fetch(...args)
  } = {}) {
    this.api = api;
    this.plotDefaults = plotDefaults;
    this.activeParams = activeParams;
    this.baseURL = baseURL;
    this.baseClientURL = baseClientURL;
    this.fetch = fetch;
    this.coordinator = api.context.coordinator;
  }

  error(message, data) {
    error(message, data);
  }
}
