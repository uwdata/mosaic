import {
  SQLExpression, and, contains, isBetween, isNotDistinct, literal,
  or, prefix, regexp_matches, suffix
} from '@uwdata/mosaic-sql';
import { MosaicClient } from './MosaicClient.js';

/**
 * @typedef {import('./util/selection-types.js').SelectionClause} SelectionClause
 * @typedef {import('./util/selection-types.js').Scale} Scale
 * @typedef {import('./util/selection-types.js').Extent} Extent
 * @typedef {import('./util/selection-types.js').MatchMethod} MatchMethod
 * @typedef {import('./util/selection-types.js').BinMethod} BinMethod
 * @typedef {SQLExpression | string} Field
 */

/**
 * Generate a selection clause for a single selected point value.
 * @param {Field} field The table column or expression to select.
 * @param {*} value The selected value.
 * @param {object} options Additional clause properties.
 * @param {*} options.source The source component generating this clause.
 * @param {Set<MosaicClient>} [options.clients] The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @returns {SelectionClause} The generated selection clause.
 */
export function point(field, value, {
  source,
  clients = source ? new Set([source]) : undefined
}) {
  /** @type {SQLExpression | null} */
  const predicate = value !== undefined
    ? isNotDistinct(field, literal(value))
    : null;
  return {
    meta: { type: 'point' },
    source,
    clients,
    value,
    predicate
  };
}

/**
 * Generate a selection clause for multiple selected point values.
 * @param {Field[]} fields The table columns or expressions to select.
 * @param {any[][]} value The selected values, as an array of arrays where
 *  each subarray contains values corresponding to each *fields* entry.
 * @param {object} options Additional clause properties.
 * @param {*} options.source The source component generating this clause.
 * @param {Set<MosaicClient>} [options.clients] The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @returns {SelectionClause} The generated selection clause.
 */
export function points(fields, value, {
  source,
  clients = source ? new Set([source]) : undefined
}) {
  /** @type {SQLExpression | null} */
  let predicate = null;
  if (value) {
    const clauses = value.map(vals => {
      const list = vals.map((v, i) => isNotDistinct(fields[i], literal(v)));
      return list.length > 1 ? and(list) : list[0];
    });
    predicate = clauses.length > 1 ? or(clauses) : clauses[0];
  }
  return {
    meta: { type: 'point' },
    source,
    clients,
    value,
    predicate
  };
}

/**
 * Generate a selection clause for a selected 1D interval.
 * @param {Field} field The table column or expression to select.
 * @param {Extent} value The selected interval as a [lo, hi] array.
 * @param {object} options Additional clause properties.
 * @param {*} options.source The source component generating this clause.
 * @param {Set<MosaicClient>} [options.clients] The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @param {Scale} [options.scale] The scale mapping descriptor.
 * @param {BinMethod} [options.bin] A binning method hint.
 * @param {number} [options.pixelSize=1] The interactive pixel size.
 * @returns {SelectionClause} The generated selection clause.
 */
export function interval(field, value, {
  source,
  clients = source ? new Set([source]) : undefined,
  bin,
  scale,
  pixelSize = 1
}) {
  /** @type {SQLExpression | null} */
  const predicate = value != null ? isBetween(field, value) : null;
  /** @type {import('./util/selection-types.js').IntervalMetadata} */
  const meta = { type: 'interval', scales: [scale], bin, pixelSize };
  return { meta, source, clients, value, predicate };
}

/**
 * Generate a selection clause for multiple selected intervals.
 * @param {Field[]} fields The table columns or expressions to select.
 * @param {Extent[]} value The selected intervals, as an array of extents.
 * @param {object} options Additional clause properties.
 * @param {*} options.source The source component generating this clause.
 * @param {Set<MosaicClient>} [options.clients] The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @param {Scale[]} [options.scales] The scale mapping descriptors,
 *  in an order matching the given *fields* and *value* extents.
 * @param {BinMethod} [options.bin] A binning method hint.
 * @param {number} [options.pixelSize=1] The interactive pixel size.
 * @returns {SelectionClause} The generated selection clause.
 */
export function intervals(fields, value, {
  source,
  clients = source ? new Set([source]) : undefined,
  bin,
  scales = [],
  pixelSize = 1
}) {
  /** @type {SQLExpression | null} */
  const predicate = value != null
    ? and(fields.map((f, i) => isBetween(f, value[i])))
    : null;
  /** @type {import('./util/selection-types.js').IntervalMetadata} */
  const meta = { type: 'interval', scales, bin, pixelSize };
  return { meta, source, clients, value, predicate };
}

const MATCH_METHODS = { contains, prefix, suffix, regexp: regexp_matches };

/**
 * Generate a selection clause for text search matching.
 * @param {Field} field The table column or expression to select.
 * @param {string} value The selected text search query string.
 * @param {object} options Additional clause properties.
 * @param {*} options.source The source component generating this clause.
 * @param {Set<MosaicClient>} [options.clients] The Mosaic clients associated
 *  with this clause. These clients are not filtered by this clause in
 *  cross-filtering contexts.
 * @param {MatchMethod} [options.method] The
 *  text matching method to use. Defaults to `'contains'`.
 * @returns {SelectionClause} The generated selection clause.
 */
export function match(field, value, {
  source, clients = undefined, method = 'contains'
}) {
  let fn = MATCH_METHODS[method];
  /** @type {SQLExpression | null} */
  const predicate = value ? fn(field, literal(value)) : null;
  /** @type {import('./util/selection-types.js').MatchMetadata} */
  const meta = { type: 'match', method };
  return { meta, source, clients, value, predicate };
}
