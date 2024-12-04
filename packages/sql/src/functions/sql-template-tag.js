/* eslint-disable jsdoc/no-undefined-types */
import { FragmentNode } from '../ast/fragment.js';
import { isNode } from '../ast/node.js';
import { ParamNode } from '../ast/param.js';
import { VerbatimNode } from '../ast/verbatim.js';
import { isParamLike, isString } from '../util/type-check.js';
import { literal } from './literal.js';

/**
 * @typedef {import('../ast/node.js').ExprNode
 *  | import('../types.js').ParamLike
 *  | string | number | boolean | Date
 * } TemplateValue
 */

/**
 * Template tag function for SQL fragments. Interpolated values
 * may be strings, other SQL expression objects (such as column
 * references), primitive values, or dynamic parameters.
 * @param {TemplateStringsArray} strings Template string constants.
 * @param {...TemplateValue} exprs Template expression values.
 */
export function sql(strings, ...exprs) {
  return new FragmentNode(parseSQL(strings, exprs));
}

function parseSQL(strings, exprs) {
  const spans = [strings[0]];
  const n = exprs.length;
  for (let i = 0, k = 0; i < n;) {
    const e = exprs[i];
    if (isNode(e)) {
      spans[++k] = e;
    } else if (isParamLike(e)) {
      spans[++k] = new ParamNode(e);
    } else {
      spans[k] += isString(e) ? e : literal(e);
    }
    const s = strings[++i];
    if (isNode(spans[k])) {
      spans[++k] = s;
    } else {
      spans[k] += s;
    }
  }

   // remove empty strings and preserve verbatim content
  return spans
    .filter(s => s)
    .map(s => isString(s) ? new VerbatimNode(s) : s);
}
