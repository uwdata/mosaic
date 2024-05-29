import { Query, and, asColumn, create, isBetween, scaleTransform, sql } from '@uwdata/mosaic-sql';
import { fnv_hash } from './util/hash.js';
import { indexColumns } from './util/index-columns.js';

/**
 * Build and query optimized indices ("data cubes") for fast computation of
 * groupby aggregate queries over compatible client queries and selections.
 * A data cube contains pre-aggregated data for a Mosaic client, subdivided
 * by possible query values from an active view. Indexes are realized as
 * as temporary database tables that can be queried for rapid updates.
 * Compatible client queries must pull data from the same backing table and
 * must consist of only groupby dimensions and supported aggregates.
 * Compatible selections must contain an active clause that exposes metadata
 * for an interval or point value predicate.
 */
export class DataCubeIndexer {
  /**
   *
   * @param {import('./Coordinator.js').Coordinator} mc a Mosaic coordinator
   * @param {*} options Options hash to configure the data cube indexes and pass selections to the coordinator.
   */
  constructor(mc, { selection, temp = true }) {
    /** @type import('./Coordinator.js').Coordinator */
    this.mc = mc;
    this.selection = selection;
    this.temp = temp;
    this.reset();
  }

  reset() {
    this.enabled = false;
    this.clients = null;
    this.indices = null;
    this.active = null;
  }

  clear() {
    if (this.indices) {
      this.mc.cancel(Array.from(this.indices.values(), index => index?.result));
      this.indices = null;
    }
  }

  index(clients, activeClause) {
    if (this.clients !== clients) {
      // test client views for compatibility
      const cols = Array.from(clients, indexColumns).filter(x => x);
      const from = cols[0]?.from;
      this.enabled = cols.length && cols.every(c => c.from === from);
      this.clients = clients;
      this.active = null;
      this.clear();
    }
    if (!this.enabled) return false; // client views are not indexable

    activeClause = activeClause || this.selection.active;
    const { source } = activeClause;
    // exit early if indexes already set up for active view
    if (source && source === this.active?.source) return true;

    this.clear();
    if (!source) return false; // nothing to work with
    const active = this.active = activeColumns(activeClause);
    if (!active) return false; // active selection clause not compatible

    const logger = this.mc.logger();
    logger.warn('DATA CUBE INDEX CONSTRUCTION');

    // create a selection with the active source removed
    const sel = this.selection.remove(source);

    // generate data cube indices
    const indices = this.indices = new Map;
    const { mc, temp } = this;
    for (const client of clients) {
      // determine if client should be skipped due to cross-filtering
      if (sel.skip(client, activeClause)) {
        indices.set(client, null);
        continue;
      }

      // generate column definitions for data cube and cube queries
      const index = indexColumns(client);

      // skip if client is not indexable
      if (!index) {
        continue;
      }

      // build index table construction query
      const query = client.query(sel.predicate(client))
        .select({ ...active.columns, ...index.aux })
        .groupby(Object.keys(active.columns));

      // ensure active view columns are selected by subqueries
      const [subq] = query.subqueries;
      if (subq) {
        const cols = Object.values(active.columns).flatMap(c => c.columns);
        subqueryPushdown(subq, cols);
      }

      // push orderby criteria to later cube queries
      const order = query.orderby();
      query.query.orderby = [];

      const sql = query.toString();
      const id = (fnv_hash(sql) >>> 0).toString(16);
      const table = `cube_index_${id}`;
      const result = mc.exec(create(table, sql, { temp }));
      result.catch(e => logger.error(e));
      indices.set(client, { table, result, order, ...index });
    }

    // index creation successful
    return true;
  }

  async update() {
    const { clients, selection, active } = this;
    const filter = active.predicate(selection.active.predicate);
    return Promise.all(
      Array.from(clients).map(client => this.updateClient(client, filter))
    );
  }

  async updateClient(client, filter) {
    const { mc, indices, selection } = this;

    // if client has no index, perform a standard update
    if (!indices.has(client)) {
      filter = selection.predicate(client);
      return mc.updateClient(client, client.query(filter));
    };

    const index = this.indices.get(client);

    // skip update if cross-filtered
    if (!index) return;

    // otherwise, query a data cube index table
    const { table, dims, aggr, order = [] } = index;
    const query = Query
      .select(dims, aggr)
      .from(table)
      .groupby(dims)
      .where(filter)
      .orderby(order);
    return mc.updateClient(client, query);
  }
}

function activeColumns(clause) {
  const { source, meta } = clause;
  let columns = clause.predicate?.columns;
  if (!meta || !columns) return null;
  const { type, scales, bin, pixelSize = 1 } = meta;
  let predicate;

  if (type === 'interval' && scales) {
    // determine pixel-level binning
    const bins = scales.map(s => binInterval(s, pixelSize, bin));

    // bail if the scale type is unsupported
    if (bins.some(b => b == null)) return null;

    if (bins.length === 1) {
      // single interval selection
      predicate = p => p ? isBetween('active0', p.range.map(bins[0])) : [];
      columns = { active0: bins[0](clause.predicate.field) };
    } else {
      // multiple interval selection
      predicate = p => p
        ? and(p.children.map(({ range }, i) => isBetween(`active${i}`, range.map(bins[i]))))
        : [];
      columns = Object.fromEntries(
        clause.predicate.children.map((p, i) => [`active${i}`, bins[i](p.field)])
      );
    }
  } else if (type === 'point') {
    predicate = x => x;
    columns = Object.fromEntries(columns.map(col => [`${col}`, asColumn(col)]));
  } else {
    // unsupported selection type
    return null;
  }

  return { source, columns, predicate };
}

const BIN = { ceil: 'CEIL', round: 'ROUND' };

function binInterval(scale, pixelSize, bin) {
  const { type, domain, range, apply, sqlApply } = scaleTransform(scale);
  if (!apply) return; // unsupported scale type
  const fn = BIN[`${bin}`.toLowerCase()] || 'FLOOR';
  const lo = apply(Math.min(...domain));
  const hi = apply(Math.max(...domain));
  const a = type === 'identity' ? 1 : Math.abs(range[1] - range[0]) / (hi - lo);
  const s = a / pixelSize === 1 ? '' : `${a / pixelSize}::DOUBLE * `;
  const d = lo === 0 ? '' : ` - ${lo}::DOUBLE`;
  return value => sql`${fn}(${s}(${sqlApply(value)}${d}))::INTEGER`;
}

function subqueryPushdown(query, cols) {
  const memo = new Set;
  const pushdown = q => {
    if (memo.has(q)) return;
    memo.add(q);
    if (q.select && q.from().length) {
      q.select(cols);
    }
    q.subqueries.forEach(pushdown);
  };
  pushdown(query);
}
