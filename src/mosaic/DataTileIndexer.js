import { Query, expr, and, isBetween, asColumn, epoch_ms } from '../sql/index.js';
import { fnv_hash } from './util/hash.js';

const identity = x => x;

/**
 * Build and query optimized indices ("data tiles") for fast computation of
 * groupby aggregate queries over compatible client queries and selections.
 * A data tile contains pre-aggregated data for a Mosaic client, subdivided
 * by possible query values from an active view. Index tiles are realized as
 * as temporary database tables that can be queried for rapid updates.
 * Compatible client queries must pull data from the same backing table and
 * must consist of only groupby dimensions and supported aggregates.
 * Compatible selections must contain an active clause that exposes a schema
 * for an interval or point value predicate.
 */
export class DataTileIndexer {

  constructor(mc, selection) {
    this.mc = mc;
    this.selection = selection;
    this.enabled = false;
    this.clients = null;
    this.indices = null;
    this.activeView = null;
  }

  index(clients) {
    if (this.clients !== clients) {
      // test client views for compatibility
      const cols = Array.from(clients).map(getIndexColumns);
      const from = cols[0]?.from;
      this.enabled = cols.every(c => c && c.from === from);
      this.clients = clients;
      this.indices = null;
      this.activeView = null;
    }
    if (!this.enabled) return false; // client views are not indexable

    const { active } = this.selection;
    if (!active.client) return false; // nothing to work with
    if (this.activeView?.client === active.client) return true; // we're good!
    const activeView = this.activeView = getActiveView(active);
    if (!activeView) return false; // active selection clause not compatible

    console.warn('DATA TILE INDEX CONSTRUCTION');

    // create a selection with the active client removed
    const sel = this.selection.clone().update({ client: active.client });

    // generate data tile indices
    const indices = this.indices = new Map;
    for (const client of clients) {
      if (sel.cross && client === active.client) continue;
      const index = getIndexColumns(client);

      // build index construction query
      const query = client.query(sel.predicate(client))
        .select({ ...activeView.columns, ...index.count })
        .groupby(Object.keys(activeView.columns));

      // ensure active view columns are selected by subqueries
      const [subq] = query.subqueries;
      if (subq) {
        const cols = Object.values(activeView.columns).map(c => c.columns[0]);
        subqueryPushdown(subq, cols);
      }

      const sql = query.toString();
      const id = (fnv_hash(sql) >>> 0).toString(16);
      const table = `tile_index_${id}`;
      indices.set(client, { table, ...index });
      createIndex(this.mc, table, sql);
    }

    return true;
  }

  async update() {
    const { clients, selection, activeView } = this;
    const where = activeView.predicate(selection.active.predicate);
    return Promise.all(
      Array.from(clients).map(client => this.updateClient(client, where))
    );
  }

  async updateClient(client, where) {
    const index = this.indices.get(client);
    if (!index) return;

    if (!where) {
      where = this.activeView.predicate(this.selection.active.predicate);
    }

    const { table, dims, aggr } = index;
    return this.mc.updateClient(client, Query
      .select(dims, aggr)
      .from(table)
      .groupby(dims)
      .where(where)
    );
  }
}

function getActiveView(clause) {
  const { client, schema } = clause;
  let columns = clause.predicate?.columns;
  if (!schema || !columns) return null;
  const { type, scales } = schema;
  let predicate;

  if (type === 'interval' && scales) {
    const bins = scales.map(s => binInterval(s));
    if (bins.some(b => b == null)) return null; // unsupported scale type

    if (bins.length === 1) {
      predicate = p => p ? isBetween('active0', p.value.map(bins[0])) : [];
      columns = { active0: bins[0](clause.predicate.expr) };
    } else {
      predicate = p => p
        ? and(p.value.map(({ value }, i) => isBetween(`active${i}`, value.map(bins[i]))))
        : [];
      columns = Object.fromEntries(
        clause.predicate.value.map((p, i) => [`active${i}`, bins[i](p.expr)])
      );
    }
  } else if (type === 'point') {
    predicate = identity;
    columns = Object.fromEntries(columns.map(col => [col.toString(), col]));
  } else {
    return null; // unsupported type
  }

  return { client, columns, predicate };
}

function binInterval(scale) {
  const { type, domain, range } = scale;
  let lift, sql;

  switch (type) {
    case 'linear':
      lift = identity;
      sql = asColumn;
      break;
    case 'log':
      lift = Math.log;
      sql = c => `LN(${asColumn(c)})`;
      break;
    case 'symlog':
      lift = x => Math.sign(x) * Math.log1p(Math.abs(x / c));
      sql = c => (c = asColumn(c), `SIGN(${c}) * LN(1 + ABS(${c}))`);
      break;
    case 'sqrt':
      lift = Math.sqrt;
      sql = c => `SQRT(${asColumn(c)})`;
      break;
    case 'utc':
    case 'time':
      lift = x => +x;
      sql = c => c instanceof Date ? +c : epoch_ms(asColumn(c));
      break;
  }
  return lift ? binFunction(domain, range, lift, sql) : null;
}

function binFunction(domain, range, lift, sql) {
  const lo = lift(Math.min(domain[0], domain[1]));
  const hi = lift(Math.max(domain[0], domain[1]));
  const a = Math.abs(lift(range[1]) - lift(range[0])) / (hi - lo);
  return value => expr(
    `FLOOR(${a}::DOUBLE * (${sql(value)} - ${lo}::DOUBLE))`,
    asColumn(value).columns
  );
}

async function createIndex(mc, table, query) {
  try {
    await mc.exec(`CREATE TEMP TABLE IF NOT EXISTS ${table} AS ${query}`);
  } catch (err) {
    console.error(err);
  }
}

function getIndexColumns(client) {
  const q = client.query();
  const from = getBaseTable(q);
  if (!from || !q.groupby || !client.filterIndexable) {
    return { from: NaN }; // early exit
  }
  const g = new Set(q.groupby().map(c => c.column));

  let aggr = [];
  let dims = [];
  let count;

  for (const { as, expr: { aggregate } } of q.select()) {
    switch (aggregate?.toUpperCase()) {
      case 'COUNT':
      case 'SUM':
        aggr.push({ [as]: expr(`SUM("${as}")::DOUBLE`) });
        break;
      case 'AVG':
        count = '_count_';
        aggr.push({ [as]: expr(`(SUM("${as}" * ${count}) / SUM(${count}))::DOUBLE`) });
        break;
      case 'MAX':
        aggr.push({ [as]: expr(`MAX("${as}")`) });
        break;
      case 'MIN':
        aggr.push({ [as]: expr(`MIN("${as}")`) });
        break;
      default:
        if (g.has(as)) dims.push(as);
        else return null;
    }
  }

  return {
    aggr,
    dims,
    count: count ? { [count]: expr('COUNT(*)') } : {},
    from
  };
}

function getBaseTable(query) {
  const subq = query.subqueries;

  // select query
  if (query.select) {
    const from = query.from();
    if (from.length > 1) return NaN;
    if (subq.length === 0) return from[0].from.table;
  }

  // handle set operations / subqueries
  let base = getBaseTable(subq[0]);
  for (let i = 1; i < subq.length; ++i) {
    const from = getBaseTable(subq[i]);
    if (from !== base) return NaN;
  }
  return base;
}

function subqueryPushdown(query, cols) {
  if (query.select) query.select(cols);
  query.subqueries.forEach(q => subqueryPushdown(q, cols));
}
