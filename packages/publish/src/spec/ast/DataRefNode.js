import { ASTNode } from './ASTNode.js';
import { DATAREF } from '../constants.js';

export class DataRefNode extends ASTNode {
  constructor(name) {
    super(DATAREF);
    this.name = name;
  }

  instantiate() {
    // TODO...
    // clients: should return the loaded data
    return this.name;
  }

  codegen() {
    return this.name;
  }
}
