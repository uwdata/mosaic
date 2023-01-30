import { or } from '../sql/index.js';
import { Signal } from './Signal.js';
import { skipClient } from './util/skip-client.js';

export function isSelection(x) {
  return x instanceof Selection;
}

export class Selection extends Signal {

  static intersect() {
    return new Selection();
  }

  static crossfilter() {
    return new Selection({ cross: true });
  }

  static union() {
    return new Selection({ union: true });
  }

  static single() {
    return new Selection({ single: true });
  }

  constructor({ union, cross, single } = {}) {
    super([]);
    this.active = null;
    this.union = !!union;
    this.cross = !!cross;
    this.single = !!single;
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
    // return value of most recently added clause
    const { clauses } = this;
    return clauses[clauses.length - 1]?.value;
  }

  get clauses() {
    return super.value;
  }

  activate(clause) {
    this.emit('activate', clause);
  }

  update(clause) {
    const { source, predicate } = clause;
    this.active = clause;
    const clauses = this.single ? [] : this.clauses.filter(c => source !== c.source);
    if (predicate) clauses.push(clause);
    return super.update(clauses);
  }

  predicate(client) {
    const { active, clauses, cross, union } = this;

    // do nothing if cross-filtering and client is currently active
    if (cross && skipClient(client, active)) return undefined;

    // remove client-specific predicates if cross-filtering
    const list = (cross
      ? clauses.filter(clause => !skipClient(client, clause))
      : clauses
    ).map(s => s.predicate);

    // return appropriate conjunction or disjunction
    // an array of predicates is implicitly conjunctive
    return union && list.length > 1 ? or(list) : list;
  }
}
