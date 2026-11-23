import { tableRef } from '@uwdata/mosaic-sql';
import { TABLE_REF } from '../constants.js';
import { ASTNode } from './ASTNode.js';

export class TableRefNode extends ASTNode {
  constructor(table) {
    super(TABLE_REF);
    this.table = table;
  }

  instantiate() {
    return tableRef(this.table);
  }

  codegen(ctx) {
    const ids = this.table.map(id => JSON.stringify(id)).join(', ');
    return `${ctx.ns()}${TABLE_REF}(${ids})`;
  }

  toJSON() {
    return this.table;
  }
}
