import { type MosaicClient } from './MosaicClient.js';
import { type ExprNode, FilterExpr, literal, MaybeArray, or } from '@uwdata/mosaic-sql';
import { Param } from './Param.js';
import { ClauseSource, SelectionClause } from './SelectionClause.js';

export interface SelectionOptions {
  /** Boolean flag indicating cross-filtered resolution. If true, selection clauses will not be applied to the clients they are associated with. */
  cross?: boolean;
  /** Boolean flag indicating if a lack of clauses should correspond to an empty selection with no records. This setting determines the default selection state. */
  empty?: boolean;
  /** Upstream selections whose clauses should be included as part of the new selection. Any clauses published to upstream selections will be relayed to the new selection. */
  include?: Selection | Selection[];
}

export interface SelectionResolverOptions extends Pick<SelectionOptions, "empty" | "cross"> {
  /** Boolean flag to indicate a union strategy. If false, an intersection strategy is used. */
  union?: boolean;
    /** Boolean flag to indicate single clauses only. */
  single?: boolean;
}

/**
 * Test if a value is a Selection instance.
 * @param x The value to test.
 * @returns True if the input is a Selection, false otherwise.
 */
export function isSelection(x: unknown): x is Selection {
  return x instanceof Selection;
}

function create(options: SelectionResolverOptions, include?: Selection | Selection[]): Selection {
  return new Selection(
    new SelectionResolver(options),
    include ? [include].flat() : undefined
  );
}

type SelectionClauseArray = SelectionClause[] & { active?: SelectionClause };
type ResolvedPredicate = MaybeArray<string | boolean | ExprNode> | undefined;

/**
 * Represents a dynamic set of query filter predicates.
 */
export class Selection extends Param<SelectionClauseArray> {
  _resolved: SelectionClauseArray;
  _resolver: SelectionResolver;
  _relay: Set<Selection>;

  /**
   * Create a new Selection instance with an
   * intersect (conjunction) resolution strategy.
   * @param options The selection options.
   * @returns The new Selection instance.
   */
  static intersect({ cross = false, empty = false, include = [] }: SelectionOptions = {}): Selection {
    return create({ cross, empty }, include);
  }

  /**
   * Create a new Selection instance with a
   * union (disjunction) resolution strategy.
   * @param options The selection options.
   * @returns The new Selection instance.
   */
  static union({ cross = false, empty = false, include = [] }: SelectionOptions = {}): Selection {
    return create({ cross, empty, union: true }, include);
  }

  /**
   * Create a new Selection instance with a singular resolution strategy
   * that keeps only the most recent selection clause.
   * @param options The selection options.
   * @returns The new Selection instance.
   */
  static single({ cross = false, empty = false, include = [] }: SelectionOptions = {}): Selection {
    return create({ cross, empty, single: true }, include);
  }

  /**
   * Create a new Selection instance with a
   * cross-filtered intersect resolution strategy.
   * @param options The selection options.
   * @returns The new Selection instance.
   */
  static crossfilter({ empty = false, include = [] }: Omit<SelectionOptions, 'cross'> = {}): Selection {
    return create({ cross: true, empty }, include);
  }

  /**
   * Create a new Selection instance.
   * @param resolver The selection resolution
   *  strategy to apply.
   * @param include Upstream selections whose clauses
   * should be included as part of this selection. Any clauses published
   * to these upstream selections will be relayed to this selection.
   */
  constructor(resolver = new SelectionResolver(), include: Selection[] = []) {
    super([]);
    this._resolved = this._value!;
    this._resolver = resolver;
    this._relay = new Set();
    if (Array.isArray(include)) {
      for (const sel of include) {
        sel._relay.add(this);
      }
    }
  }

  /**
   * Create a cloned copy of this Selection instance.
   * @returns A clone of this selection.
   */
  clone(): Selection {
    const s = new Selection(this._resolver);
    s._value = s._resolved = this._value!;
    return s;
  }

  /**
   * Create a clone of this Selection with clauses corresponding
   * to the provided source removed.
   * @param source The clause source to remove.
   * @returns A cloned and updated Selection.
   */
  remove(source: ClauseSource): Selection {
    const s = this.clone();
    s._value = s._resolved = s._resolver.resolve(
      this._resolved,
      { source } as SelectionClause
    );
    s._value.active = { source } as SelectionClause;
    return s;
  }

  /**
   * The selection clause resolver.
   */
  get resolver(): SelectionResolver {
    return this._resolver;
  }

  /**
   * Indicate if this selection has a single resolution strategy.
   */
  get single(): boolean {
    return this._resolver.single;
  }

  /**
   * The current array of selection clauses.
   */
  get clauses(): SelectionClauseArray {
    return super.value!;
  }

  /**
   * The current active (most recently updated) selection clause.
   */
  get active(): SelectionClause {
    return this.clauses.active!;
  }

  /**
   * The value corresponding to the current active selection clause.
   * This method ensures compatibility where a normal Param is expected.
   */
  // @ts-expect-error return type differs from Param parent class
  get value(): unknown {
    return this.active?.value;
  }

  /**
   * The value corresponding to a given source. Returns undefined if
   * this selection does not include a clause from this source.
   * @param source The clause source to look up the value for.
   */
  valueFor(source: unknown): unknown {
    return this.clauses.find(c => c.source === source)?.value;
  }

  /**
   * Emit an activate event with the given selection clause.
   * @param clause The clause representing the potential activation.
   */
  activate(clause: SelectionClause): void {
    // @ts-expect-error selection operates differently than scalar param
    this.emit('activate', clause);
    this._relay.forEach(sel => sel.activate(clause));
  }

  /**
   * Update the selection with a new selection clause.
   * @param clause The selection clause to add.
   * @returns This Selection instance.
   */
  // @ts-expect-error selection and param use differing value types
  update(clause: SelectionClause): this {
    // we maintain an up-to-date list of all resolved clauses
    // this ensures consistent clause state across unemitted event values
    this._resolved = this._resolver.resolve(this._resolved, clause, true);
    this._resolved.active = clause;
    this._relay.forEach(sel => sel.update(clause));
    return super.update(this._resolved);
  }

  /**
   * Reset the selection state by removing all provided clauses. If no clause
   * array is provided as an argument, all current clauses are removed. The
   * reset method (if defined) is invoked on all corresponding clause sources.
   * The reset is relayed to downstream selections that include this selection.
   * @param clauses The clauses to remove. If unspecified, all current clauses are removed.
   * @returns This selection instance.
   */
  reset(clauses?: SelectionClause[]): this {
    clauses ??= this._resolved;
    clauses.forEach(c => c.source?.reset?.());
    this._resolved = this._resolved.filter(c => clauses!.includes(c));
    this._relay.forEach(sel => sel.reset(clauses));
    return super.update(this._resolved = []);
  }

  /**
   * Upon value-typed updates, sets the current clause list to the
   * input value and returns the active clause value.
   * @param type The event type.
   * @param value The input event value.
   * @returns For value-typed events, returns the active clause
   *  values. Otherwise returns the input event value as-is.
   */
  // @ts-expect-error selection and param use differing value types
  willEmit(type: string, value: unknown): unknown {
    if (type === 'value') {
      this._value = value as SelectionClauseArray;
      return this.value;
    }
    return value;
  }

  /**
   * Upon value-typed updates, returns a dispatch queue filter function.
   * The return value depends on the selection resolution strategy.
   * @param type The event type.
   * @param value The new event value that will be enqueued.
   * @returns A dispatch queue filter function. For non-value events,
   *  returns a function that always returns null (no filtering).
   */
  // @ts-expect-error selection and param use differing value types
  emitQueueFilter(
    type: string,
    value: SelectionClauseArray
  ): ((value: SelectionClauseArray) => boolean) | null {
    return type === 'value'
      ? this._resolver.queueFilter(value)
      : null;
  }

  /**
   * Indicates if a selection clause should not be applied to a given client.
   * The return value depends on the selection resolution strategy.
   * @param client The client to test.
   * @param clause The selection clause.
   * @returns True if the client should be skipped, false otherwise.
   */
  skip(client: MosaicClient, clause: SelectionClause): boolean {
    return this._resolver.skip(client, clause);
  }

  /**
   * Return a selection query predicate for the given client.
   * @param client The client whose data may be filtered.
   * @param noSkip Disable skipping of active
   *  cross-filtered sources. If set true, the source of the active
   *  clause in a cross-filtered selection will not be skipped.
   * @returns The query predicate for filtering client data,
   *  based on the current state of this selection.
   */
  predicate(client: MosaicClient, noSkip: boolean = false): ResolvedPredicate {
    const { clauses } = this;
    const active = noSkip ? null : clauses.active;
    return this._resolver.predicate(clauses, active!, client);
  }
}

/**
 * Implements selection clause resolution strategies.
 */
export class SelectionResolver {
  union: boolean;
  cross: boolean;
  single: boolean;
  empty: boolean;

  /**
   * Create a new selection resolved instance.
   * @param options The resolution strategy options.
   * @param options.union Boolean flag to indicate a union strategy.
   *  If false, an intersection strategy is used.
   * @param options.cross Boolean flag to indicate cross-filtering.
   * @param options.single Boolean flag to indicate single clauses only.
   * @param options.empty Boolean flag indicating if a lack
   *  of clauses should correspond to an empty selection with no records. This
   *  setting determines the default selection state.
   */
  constructor({ union, cross, single, empty }: SelectionResolverOptions = {}) {
    this.union = !!union;
    this.cross = !!cross;
    this.single = !!single;
    this.empty = !!empty;
  }

  /**
   * Resolve a list of selection clauses according to the resolution strategy.
   * @param clauseList An array of selection clauses.
   * @param clause A new selection clause to add.
   * @returns An updated array of selection clauses.
   */
  resolve(
    clauseList: SelectionClause[],
    clause: SelectionClause,
    reset: boolean = false
  ): SelectionClause[] {
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
   * @param client The selection clause.
   * @param clause The client to test.
   * @returns True if the client should be skipped, false otherwise.
   */
  skip(client: MosaicClient, clause: SelectionClause): boolean {
    return Boolean(this.cross && clause?.clients?.has(client));
  }

  /**
   * Return a selection query predicate for the given client.
   * @param clauseList An array of selection clauses.
   * @param active The current active selection clause.
   * @param client The client whose data may be filtered.
   * @returns The query predicate for filtering client data,
   *  based on the current state of this selection.
   */
  predicate(
    clauseList: SelectionClause[],
    active: SelectionClause,
    client: MosaicClient
  ): ResolvedPredicate {
    const { empty, union } = this;

    if (empty && !clauseList.length) {
      return [literal(false)];
    }

    // do nothing if cross-filtering and client is currently active
    if (this.skip(client, active)) return undefined;

    // remove client-specific predicates if cross-filtering
    const predicates: FilterExpr = clauseList
      .filter(clause => !this.skip(client, clause))
      .map(clause => clause.predicate!);

    // return appropriate conjunction or disjunction
    // an array of predicates is implicitly conjunctive
    return union && predicates.length > 1 ? or(predicates) : predicates;
  }

  /**
   * Returns a filter function for queued selection updates.
   * @param value The new event value that will be enqueued.
   * @returns A dispatch queue filter
   *  function, or null if all unemitted event values should be filtered.
   */
  queueFilter(
    value: SelectionClauseArray
  ): ((value: SelectionClauseArray) => boolean) | null {
    if (this.cross) {
      const source = value.active?.source;
      return value => value.active?.source !== source;
    }
    return null;
  }
}