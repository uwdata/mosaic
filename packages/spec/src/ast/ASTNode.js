export class ASTNode {
  constructor(type, children = null) {
    this.type = type;
    this.children = children;
  }

  instantiate(/* ctx */) {
    throw Error('instantiate not implemented');
  }

  codegen(/* ctx */) {
    return Error('codegen not implemented');
  }

  toJSON() {
    return Error('toJSON not implemented');
  }
}
