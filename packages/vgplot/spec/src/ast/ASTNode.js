/**
 * Abstract base class for Mosaic spec AST nodes.
 */
export class ASTNode {
  constructor(type, children = null) {
    /** @type {string} */
    this.type = type;
    /** @type {ASTNode[] | null} */
    this.children = children;
  }

  /**
   * Instantiate this AST node to use in a live web application.
   * @param {import('../ast-to-dom.js').InstantiateContext} ctx The instantiation context.
   * @returns {*} The instantiated value of this node.
   */
  instantiate(_ctx) {
    throw Error('instantiate not implemented');
  }

  /**
   * Generate ESM code for this AST node.
   * @param {import('../ast-to-esm.js').CodegenContext} ctx The code generator context.
   * @returns {string|void} The generated ESM code for the node.
   */
  codegen(_ctx) {
    // @ts-expect-error intentionally returns Error instead of declared string|void
    return Error('codegen not implemented');
  }

  /**
   * @returns {*} This AST node in JSON specification format.
   */
  toJSON() {
    return Error('toJSON not implemented');
  }
}
