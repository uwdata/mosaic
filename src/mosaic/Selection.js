import { or } from '../sql/index.js';
import { Signal } from './Signal.js';

export function isSelection(x) {
  return x instanceof Selection;
}

export class Selection extends Signal {
  constructor({ union = false, cross = !union } = {}) {
    super([]);
    this.active = null;
    this.union = union;
    this.cross = cross;
  }

  clone() {
    const s = new Selection();
    s.active = this.active;
    s.union = this.union;
    s.cross = this.cross;
    s._value = this._value;
    return s;
  }

  get value() {
    const { clauses } = this;
    return clauses[clauses.length - 1]?.value;
  }

  get clauses() {
    return super.value;
  }

  activate(clause) {
    this.active = clause;
    this.emit('active', this.active);
  }

  update(clause) {
    const { client, predicate } = clause;
    this.active = clause;
    const clauses = this.clauses.filter(s => s.client !== client);
    if (predicate) clauses.push(clause);
    return super.update(clauses);
  }

  predicate(client) {
    const { active, clauses, cross, union } = this;
    if (cross && client === active?.client) return undefined;
    const list = (cross
      ? clauses.filter(s => s.client !== client)
      : clauses
    ).map(s => s.predicate);
    return union && list.length > 1 ? or(list) : list;
  }
}
