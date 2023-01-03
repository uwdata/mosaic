import { or } from '../sql/index.js';
import { Signal } from './Signal.js';

export function isSelection(x) {
  return x instanceof Selection;
}

export class Selection extends Signal {
  constructor({ union = false, cross = !union } = {}) {
    super(null, []);
    this._predicate = null;
    this._latest = null;
    this._union = union;
    this._all = !cross;
  }

  get value() {
    const { selection } = this;
    return selection[selection.length - 1]?.value;
  }

  get selection() {
    return super.value;
  }

  update(clause) {
    const { source, predicate } = clause;
    this._latest = source;
    this._predicate = null;
    const clauses = this.selection.filter(s => s.source !== source);
    if (predicate) clauses.push(clause);
    super.update(clauses);
  }

  source() {
    const { selection } = this;
    return selection.length === 1 ? selection[0].source : null;
  }

  predicate(source) {
    const { selection, _all, _union, _latest } = this;
    if (!_all && source === _latest) return undefined;
    const sels = _all ? selection : selection.filter(s => s.source !== source);
    const list = sels.map(s => s.predicate);
    return _union ? or(list) : list;
  }
}
