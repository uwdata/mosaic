import { paramRef, toArray } from '../util.js';
import { ASTNode } from './ASTNode.js';
import { RELAY } from '../constants.js';

function selectionRef(name, ctx) {
  return ctx.selectionRef(name, true) ?? ctx.error(
    `Parameter "${name}" is not a selection and can not be in a relay.`
  );
}

export function parseRelay(spec, ctx) {
  return spec && new RelayNode(new Map(
    Object.entries(spec).map(([name, refs]) => {
      return [
        selectionRef(name, ctx),
        toArray(refs).map(name => selectionRef(paramRef(name), ctx))
      ];
    })
  ));
}

export class RelayNode extends ASTNode {
  constructor(relays) {
    super(RELAY);
    this.relays = relays;
  }

  instantiate(ctx) {
    for (const [src, refs] of this.relays) {
      const sel = src.instantiate(ctx);
      const to = refs.map(ref => ref.instantiate(ctx));
      sel.relay(to);
    }
  }

  codegen(ctx) {
    return Array.from(this.relays, ([src, refs]) => {
      const sel = src.codegen(ctx);
      const to = refs.map(ref => ref.codegen(ctx));
      const arg = to.length > 1 ? `[${to.join(', ')}]` : to[0];
      return `${ctx.tab()}${sel}.relay(${arg});`
    }).join('\n');
  }

  toJSON() {
    const json = {};
    for (const [src, refs] of this.relays) {
      json[src.name] = refs.map(ref => ref.toJSON());
    }
    return json;
  }
}
