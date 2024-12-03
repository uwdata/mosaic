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
  instantiate(ctx) {
    // eslint-disable-line no-unused-vars
    // @ts-ignore
    throw Error("instantiate not implemented");
  }

  /**
   * Generate ESM code for this AST node.
   * @param {import('../ast-to-esm.js').CodegenContext} ctx The code generator context.
   * @returns {string|void} The generated ESM code for the node.
   */
  codegen(ctx) {
    // eslint-disable-line no-unused-vars
    // @ts-ignore
    return Error("codegen not implemented");
  }

  /**
   * @returns {*} This AST node in JSON specification format.
   */
  toJSON() {
    // @ts-ignore
    return Error("toJSON not implemented");
  }

  /**
   * Generate Python code for this AST node.
   * @param {import('../ast-to-python.js').PythonCodegenContext} ctx The Python code generator context.
   * @returns {string} The generated Python code for the node.
   */
  toPython(ctx) {
    // Default implementation: convert to JSON and return as Python dict literal
    return JSON.stringify(this.toJSON());
  }
}
