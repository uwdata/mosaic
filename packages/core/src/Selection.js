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
    this._resolved = this._value;
    this._resolver = resolver;
  }

  clone() {
    const s = new Selection(this._resolver);
    s._value = s._resolved = this._value;
    return s;
  }

  remove(source) {
    const s = this.clone();
    s._value = s._resolved = this._resolved.filter(c => c.source !== source);
    s._value.active = { source };
    return s;
  }

  get active() {
    return this.clauses.active;
  }

  get value() {
    // return value of the active clause
    return this.active?.value;
  }

  get clauses() {
    return super.value;
  }

  activate(clause) {
    this.emit('activate', clause);
  }

  update(clause) {
    this._resolved = this._resolver.resolve(this._resolved, clause);
    this._resolved.active = clause;
    return super.update(this._resolved);
  }

  willEmit(type, value) {
    if (type === 'value') {
      this._value = value;
      return this.value;
    }
    return value;
  }

  queueEmit(type, value, chain) {
    return type === 'value'
      ? this._resolver.queue(value, chain)
      : super.queueEmit(type, value, chain);
  }

  skip(client, clause) {
    return this._resolver.skip(client, clause);
  }

  predicate(client) {
    const { clauses } = this;
    return this._resolver.predicate(clauses, clauses.active, client);
  }
}

export class SelectionResolver {
  constructor({ union, cross, single } = {}) {
    this.union = !!union;
    this.cross = !!cross;
    this.single = !!single;
  }

  resolve(clauseList, clause) {
    const { source, predicate } = clause;
    const filtered = clauseList.filter(c => source !== c.source);
    const clauses = this.single ? [] : filtered;
    if (this.single) filtered.forEach(c => c.source?.reset?.());
    if (predicate) clauses.push(clause);
    return clauses;
  }

  skip(client, clause) {
    return this.cross && clause?.clients?.has(client);
  }

  predicate(clauseList, active, client) {
    const { union } = this;

    // do nothing if cross-filtering and client is currently active
    if (this.skip(client, active)) return undefined;

    // remove client-specific predicates if cross-filtering
    const predicates = clauseList
      .filter(clause => !this.skip(client, clause))
      .map(clause => clause.predicate);

    // return appropriate conjunction or disjunction
    // an array of predicates is implicitly conjunctive
    return union && predicates.length > 1 ? or(predicates) : predicates;
  }

  queue(value, chain) {
    const tail = { value };
    const source = last(value)?.source;
    if (this.cross && chain) {
      const head = { next: chain };
      let curr = head;
      while (curr.next) {
        const src = last(curr.next.value)?.source;
        if (source === src) {
          curr.next = curr.next.next;
        } else {
          curr = curr.next;
        }
      }
      curr.next = tail;
      return head.next;
    } else {
      return tail;
    }
  }
}

function last(array) {
  return array[array.length - 1];
}
