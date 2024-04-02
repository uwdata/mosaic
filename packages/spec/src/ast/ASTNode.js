export class ASTNode {
  constructor(type, children = null) {
    this.type = type;
    this.children = children;
  }

  /**
   * @returns {void}
   */
  instantiate(/* ctx */) {
    // @ts-ignore
    throw Error('instantiate not implemented');
  }

  /**
   * @returns {string} The for for the node.
   */
  codegen(/* ctx */) {
    // @ts-ignore
    return Error('codegen not implemented');
  }

  /**
   * @returns {object} The node as JSON.
   */
  toJSON() {
    // @ts-ignore
    return Error('toJSON not implemented');
  }
}
