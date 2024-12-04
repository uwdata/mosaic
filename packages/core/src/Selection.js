import { literal, or } from '@uwdata/mosaic-sql';
import { Param } from './Param.js';
import { MosaicClient } from './MosaicClient.js';

/**
 * Test if a value is a Selection instance.
 * @param {*} x The value to test.
 * @returns {x is Selection} True if the input is a Selection, false otherwise.
 */
export function isSelection(x) {
  return x instanceof Selection;
}

function create(options, include) {
  return new Selection(
    new SelectionResolver(options),
    include ? [include].flat() : include
  );
}

/**
 * Represents a dynamic set of query filter predicates.
 */
export class Selection extends Param {

  /**
   * Create a new Selection instance with an
   * intersect (conjunction) resolution strategy.
   * @param {object} [options] The selection options.
   * @param {boolean} [options.cross=false] Boolean flag indicating
   *  cross-filtered resolution. If true, selection clauses will not
   *  be applied to the clients they are associated with.
   * @param {boolean} [options.empty=false] Boolean flag indicating if a lack
   *  of clauses should correspond to an empty selection with no records. This
   *  setting determines the default selection state.
   * @param {Selection|Selection[]} [options.include] Upstream selections whose
   *  clauses should be included as part of the new selection. Any clauses
   *  published to upstream selections will be relayed to the new selection.
   * @returns {Selection} The new Selection instance.
   */
  static intersect({ cross = false, empty = false, include = [] } = {}) {
    return create({ cross, empty }, include);
  }

  /**
   * Create a new Selection instance with a
   * union (disjunction) resolution strategy.
   * @param {object} [options] The selection options.
   * @param {boolean} [options.cross=false] Boolean flag indicating
   *  cross-filtered resolution. If true, selection clauses will not
   *  be applied to the clients they are associated with.
   * @param {boolean} [options.empty=false] Boolean flag indicating if a lack
   *  of clauses should correspond to an empty selection with no records. This
   *  setting determines the default selection state.
   * @param {Selection|Selection[]} [options.include] Upstream selections whose
   *  clauses should be included as part of the new selection. Any clauses
   *  published to upstream selections will be relayed to the new selection.
   * @returns {Selection} The new Selection instance.
   */
  static union({ cross = false, empty = false, include = [] } = {}) {
    return create({ cross, empty, union: true }, include);
  }

  /**
   * Create a new Selection instance with a singular resolution strategy
   * that keeps only the most recent selection clause.
   * @param {object} [options] The selection options.
   * @param {boolean} [options.cross=false] Boolean flag indicating
   *  cross-filtered resolution. If true, selection clauses will not
   *  be applied to the clients they are associated with.
   * @param {boolean} [options.empty=false] Boolean flag indicating if a lack
   *  of clauses should correspond to an empty selection with no records. This
   *  setting determines the default selection state.
   * @param {Selection|Selection[]} [options.include] Upstream selections whose
   *  clauses should be included as part of the new selection. Any clauses
   *  published to upstream selections will be relayed to the new selection.
   * @returns {Selection} The new Selection instance.
   */
  static single({ cross = false, empty = false, include = [] } = {}) {
    return create({ cross, empty, single: true }, include);
  }

  /**
   * Create a new Selection instance with a
   * cross-filtered intersect resolution strategy.
   * @param {object} [options] The selection options.
   * @param {boolean} [options.empty=false] Boolean flag indicating if a lack
   *  of clauses should correspond to an empty selection with no records. This
   *  setting determines the default selection state.
   * @param {Selection|Selection[]} [options.include] Upstream selections whose
   *  clauses should be included as part of the new selection. Any clauses
   *  published to upstream selections will be relayed to the new selection.
   * @returns {Selection} The new Selection instance.
   */
  static crossfilter({ empty = false, include = [] } = {}) {
    return create({ cross: true, empty }, include);
  }

  /**
   * Create a new Selection instance.
   * @param {SelectionResolver} [resolver] The selection resolution
   *  strategy to apply.
   * @param {Selection[]} [include] Upstream selections whose clauses
   * should be included as part of this selection. Any clauses published
   * to these upstream selections will be relayed to this selection.
   */
  constructor(resolver = new SelectionResolver(), include = []) {
    super([]);
    this._resolved = this._value;
    this._resolver = resolver;
    /** @type {Set<Selection>} */
    this._relay = new Set;
    if (Array.isArray(include)) {
      for (const sel of include) {
        sel._relay.add(this);
      }
    }
  }

  /**
   * Create a cloned copy of this Selection instance.
   * @returns {Selection} A clone of this selection.
   */
  clone() {
    const s = new Selection(this._resolver);
    s._value = s._resolved = this._value;
    return s;
  }

  /**
   * Create a clone of this Selection with clauses corresponding
   * to the provided source removed.
   * @param {*} source The clause source to remove.
   * @returns {Selection} A cloned and updated Selection.
   */
  remove(source) {
    const s = this.clone();
    s._value = s._resolved = s._resolver.resolve(this._resolved, { source });
    s._value.active = { source };
    return s;
  }

  /**
   * The selection clause resolver.
   */
  get resolver() {
    return this._resolver;
  }

  /**
   * Indicate if this selection has a single resolution strategy.
   */
  get single() {
    return this._resolver.single;
  }

  /**
   * The current array of selection clauses.
   */
  get clauses() {
    return super.value;
  }

  /**
   * The current active (most recently updated) selection clause.
   */
  get active() {
    return this.clauses.active;
  }

  /**
   * The value corresponding to the current active selection clause.
   * This method ensures compatibility where a normal Param is expected.
   */
  get value() {
    return this.active?.value;
  }

  /**
   * The value corresponding to a given source. Returns undefined if
   * this selection does not include a clause from this source.
   * @param {*} source The clause source to look up the value for.
   */
  valueFor(source) {
    return this.clauses.find(c => c.source === source)?.value;
  }

  /**
   * Emit an activate event with the given selection clause.
   * @param {*} clause The clause repesenting the potential activation.
   */
  activate(clause) {
    this.emit('activate', clause);
    this._relay.forEach(sel => sel.activate(clause));
  }

  /**
   * Update the selection with a new selection clause.
   * @param {*} clause The selection clause to add.
   * @returns {this} This Selection instance.
   */
  update(clause) {
    // we maintain an up-to-date list of all resolved clauses
    // this ensures consistent clause state across unemitted event values
    this._resolved = this._resolver.resolve(this._resolved, clause, true);
    this._resolved.active = clause;
    this._relay.forEach(sel => sel.update(clause));
    return super.update(this._resolved);
  }

  /**
   * Upon value-typed updates, sets the current clause list to the
   * input value and returns the active clause value.
   * @param {string} type The event type.
   * @param {*} value The input event value.
   * @returns {*} For value-typed events, returns the active clause
   *  values. Otherwise returns the input event value as-is.
   */
  willEmit(type, value) {
    if (type === 'value') {
      this._value = value;
      return this.value;
    }
    return value;
  }

  /**
   * Upon value-typed updates, returns a dispatch queue filter function.
   * The return value depends on the selection resolution strategy.
   * @param {string} type The event type.
   * @param {*} value The new event value that will be enqueued.
   * @returns {(value: *) => boolean|null} For value-typed events,
   *  returns a dispatch queue filter function. Otherwise returns null.
   */
  emitQueueFilter(type, value) {
    return type === 'value'
      ? this._resolver.queueFilter(value)
      : null;
  }

  /**
   * Indicates if a selection clause should not be applied to a given client.
   * The return value depends on the selection resolution strategy.
   * @param {*} client The selection clause.
   * @param {*} clause The client to test.
   * @returns True if the client should be skipped, false otherwise.
   */
  skip(client, clause) {
    return this._resolver.skip(client, clause);
  }

  /**
   * Return a selection query predicate for the given client.
   * @param {*} client The client whose data may be filtered.
   * @param {boolean} [noSkip=false] Disable skipping of active
   *  cross-filtered sources. If set true, the source of the active
   *  clause in a cross-filtered selection will not be skipped.
   * @returns {*} The query predicate for filtering client data,
   *  based on the current state of this selection.
   */
  predicate(client, noSkip = false) {
    const { clauses } = this;
    const active = noSkip ? null : clauses.active;
    return this._resolver.predicate(clauses, active, client);
  }
}

/**
 * Implements selection clause resolution strategies.
 */
export class SelectionResolver {

  /**
   * Create a new selection resolved instance.
   * @param {object} [options] The resolution strategy options.
   * @param {boolean} [options.union=false] Boolean flag to indicate a union strategy.
   *  If false, an intersection strategy is used.
   * @param {boolean} [options.cross=false] Boolean flag to indicate cross-filtering.
   * @param {boolean} [options.single=false] Boolean flag to indicate single clauses only.
   * @param {boolean} [options.empty=false] Boolean flag indicating if a lack
   *  of clauses should correspond to an empty selection with no records. This
   *  setting determines the default selection state.
   */
  constructor({ union, cross, single, empty } = {}) {
    this.union = !!union;
    this.cross = !!cross;
    this.single = !!single;
    this.empty = !!empty;
  }

  /**
   * Resolve a list of selection clauses according to the resolution strategy.
   * @param {*[]} clauseList An array of selection clauses.
   * @param {*} clause A new selection clause to add.
   * @returns {*[]} An updated array of selection clauses.
   */
  resolve(clauseList, clause, reset = false) {
    const { source, predicate } = clause;
    const filtered = clauseList.filter(c => source !== c.source);
    const clauses = this.single ? [] : filtered;
    if (this.single && reset) filtered.forEach(c => c.source?.reset?.());
    if (predicate) clauses.push(clause);
    return clauses;
  }

  /**
   * Indicates if a selection clause should not be applied to a given client.
   * The return value depends on the resolution strategy.
   * @param {*} client The selection clause.
   * @param {*} clause The client to test.
   * @returns True if the client should be skipped, false otherwise.
   */
  skip(client, clause) {
    return this.cross && clause?.clients?.has(client);
  }

  /**
   * Return a selection query predicate for the given client.
   * @param {import('./util/selection-types.js').SelectionClause[]} clauseList
   *  An array of selection clauses.
   * @param {import('./util/selection-types.js').SelectionClause} active
   *  The current active selection clause.
   * @param {MosaicClient} client The client whose data may be filtered.
   * @returns {*} The query predicate for filtering client data,
   *  based on the current state of this selection.
   */
  predicate(clauseList, active, client) {
    const { empty, union } = this;

    if (empty && !clauseList.length) {
      return [literal(false)];
    }

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

  /**
   * Returns a filter function for queued selection updates.
   * @param {*} value The new event value that will be enqueued.
   * @returns {(value: *) => boolean|null} A dispatch queue filter
   *  function, or null if all unemitted event values should be filtered.
   */
  queueFilter(value) {
    if (this.cross) {
      const source = value.active?.source;
      return clauses => clauses.active?.source !== source;
    }
    return null;
  }
}
