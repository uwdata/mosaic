import { or } from '@uwdata/mosaic-sql';
import { Param } from './Param.js';

export function isSelection(x) {
  return x instanceof Selection;
}

export class Selection extends Param {

  static intersect() {
    return new Selection();
  }

  static crossfilter() {
    return new Selection(new SelectionResolver({ cross: true }));
  }

  static union() {
    return new Selection(new SelectionResolver({ union: true }));
  }

  static single() {
    return new Selection(new SelectionResolver({ single: true }));
  }

  constructor(resolver = new SelectionResolver()) {
    super([]);
    this._resolver = resolver;
  }

  clone() {
    const s = new Selection(this._resolver);
    s._value = this._value;
    return s;
  }

  remove(source) {
    const s = this.clone();
    s._value = (this._resolved || this._value).filter(c => c.source !== source);
    return s;
  }

  get value() {
    // return value of most recently added clause
    // TODO: walk back to find first entry with a predicate?
    return this.active?.value;
  }

  get active() {
    const { clauses } = this;
    return clauses[clauses.length - 1];
  }

  get clauses() {
    return super.value;
  }

  activate(clause) {
    this.emit('activate', clause);
  }

  update(clause) {
    this._resolved = this._resolver.resolve(this.clauses, clause);
    return super.update(this._resolved);
  }

  willEmit(type, value) {
    if (type === 'value') {
      this._value = value;
      return this.value;
    }
    return value;
  }

  skip(client, clause) {
    return this._resolver.skip(client, clause);
  }

  predicate(client) {
    return this._resolver.predicate(this.clauses, client);
  }
}

export class SelectionResolver {
  constructor({ union, cross, single } = {}) {
    this.union = !!union;
    this.cross = !!cross;
    this.single = !!single;
  }

  resolve(clauseList, clause) {
    const { source } = clause;
    const filtered = clauseList.filter(c => source !== c.source);
    const clauses = this.single ? [] : filtered;
    if (this.single) filtered.forEach(c => c.source?.reset?.());
    clauses.push(clause);
    return clauses;
  }

  skip(client, clause) {
    return this.cross && clause?.clients?.has(client);
  }

  predicate(clauseList, client) {
    const { union } = this;
    const active = clauseList[clauseList.length - 1];

    // do nothing if cross-filtering and client is currently active
    if (this.skip(client, active)) return undefined;

    // remove client-specific predicates if cross-filtering
    const predicates = clauseList
      .filter(clause => clause.predicate && !this.skip(client, clause))
      .map(clause => clause.predicate);

    // return appropriate conjunction or disjunction
    // an array of predicates is implicitly conjunctive
    return union && predicates.length > 1 ? or(predicates) : predicates;
  }
}
