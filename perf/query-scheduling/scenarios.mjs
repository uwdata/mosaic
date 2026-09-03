/**
 * Query scheduling benchmark scenarios for uwdata/mosaic#510.
 *
 * Each scenario drives a Coordinator with a mock connector that simulates
 * server latency. Latencies are derived from the query SQL text, so they are
 * identical regardless of the order in which queries are submitted, making
 * results comparable across scheduler implementations.
 *
 * The mosaic modules are passed in, so the same scenarios can run against
 * different builds (e.g. this branch versus main).
 */

const now = () => performance.now();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * FNV-1a string hash for deterministic per-query latency jitter.
 * Intentionally duplicates mosaic-core's fnv_hash: the benchmark must
 * produce identical latencies for every checkout it runs against.
 */
function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; ++i) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A connector that resolves queries after a simulated latency.
 * @param latencyFor Callback mapping a connector request to a latency in ms.
 */
function latencyConnector(latencyFor) {
  const stats = { count: 0, inflight: 0, maxInflight: 0 };
  return {
    stats,
    async query(req) {
      stats.count += 1;
      stats.inflight += 1;
      stats.maxInflight = Math.max(stats.maxInflight, stats.inflight);
      await sleep(latencyFor(req));
      stats.inflight -= 1;
      return req.type === 'exec' ? null : [];
    }
  };
}

/**
 * Pre-aggregation style workload: each of 8 clients materializes its own
 * table (exec of CREATE TABLE ... AS SELECT FROM base), awaits it, and then
 * issues 3 reads against that table. Mirrors what the PreAggregator does
 * when a brush activates over a multi-chart dashboard.
 */
async function preaggregation(core, sql) {
  const { Coordinator } = core;
  const { Query, TableRefNode, createTable, literal } = sql;
  const EXEC_MS = 40;
  const READ_MS = 15;
  const CLIENTS = 8;
  const READS = 3;

  const connector = latencyConnector(
    req => req.type === 'exec' ? EXEC_MS : READ_MS
  );
  const coord = new Coordinator(connector, {
    logger: null, cache: false, consolidate: false
  });

  const t0 = now();
  const updates = await Promise.all(Array.from({ length: CLIENTS }, async (_, i) => {
    const table = new TableRefNode(['mosaic', `preagg_${i}`]);
    await coord.exec(createTable(table, Query.select('a').from('base'), { temp: false }));
    await Promise.all(Array.from({ length: READS }, (_, k) =>
      coord.query(Query.select('a', { k: literal(k) }).from(table), { cache: false })
    ));
    return now() - t0;
  }));
  return {
    wall: now() - t0,
    meanClientUpdate: mean(updates),
    queries: connector.stats.count,
    maxInflight: connector.stats.maxInflight
  };
}

/**
 * Brush storm workload: 6 clients each receive 5 rounds of update queries,
 * issued in interleaved order (round 1 for all clients, then round 2, ...)
 * as a selection would. Query latencies are jittered (10-60 ms). All queries
 * are independent reads, so both schedulers submit them all in parallel; the
 * difference is when results reach clients. Measures the mean latency from
 * request to client update, and the mean time until each client has
 * received all of its updates.
 */
async function brushStorm(core) {
  const { Coordinator, MosaicClient } = core;
  const CLIENTS = 6;
  const ROUNDS = 5;

  const connector = latencyConnector(req => 10 + hash(req.sql) % 51);
  const coord = new Coordinator(connector, {
    logger: null, cache: false, consolidate: false
  });

  const t0 = now();
  const latencies = [];
  const clients = Array.from({ length: CLIENTS }, () => {
    const client = new MosaicClient();
    client.queryResult = () => {
      latencies.push(now() - t0);
      return client;
    };
    return client;
  });
  const updates = [];
  for (let round = 0; round < ROUNDS; ++round) {
    clients.forEach((client, c) => {
      updates.push(coord.updateClient(client, `SELECT c${c} FROM base WHERE round = ${round}`));
    });
  }
  const clientDone = await Promise.all(
    clients.map((client, c) => Promise.all(
      updates.filter((_, i) => i % CLIENTS === c)
    ).then(() => now() - t0))
  );
  return {
    wall: now() - t0,
    meanQueryLatency: mean(latencies),
    meanClientDone: mean(clientDone),
    queries: connector.stats.count,
    maxInflight: connector.stats.maxInflight
  };
}

/**
 * Parity check: independent reads with identical latency.
 * Both schedulers should submit all queries immediately; wall time should
 * be close to the single-query latency for both.
 */
async function uniformReads(core) {
  const READ_MS = 20;
  const READS = 20;
  const { Coordinator } = core;
  const connector = latencyConnector(() => READ_MS);
  const coord = new Coordinator(connector, {
    logger: null, cache: false, consolidate: false
  });
  const t0 = now();
  await Promise.all(Array.from(
    { length: READS },
    (_, i) => coord.query(`SELECT ${i} FROM base`, { cache: false })
  ));
  return {
    wall: now() - t0,
    queries: connector.stats.count,
    maxInflight: connector.stats.maxInflight
  };
}

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Run all scenarios against the provided mosaic modules.
 * @param core The @uwdata/mosaic-core module.
 * @param sql The @uwdata/mosaic-sql module.
 * @param repeats Number of repetitions; medians are reported.
 */
export async function runScenarios(core, sql, repeats = 5) {
  const scenarios = { preaggregation, brushStorm, uniformReads };
  const results = {};
  for (const [name, scenario] of Object.entries(scenarios)) {
    const runs = [];
    for (let i = 0; i < repeats; ++i) {
      runs.push(await scenario(core, sql));
    }
    const summary = {};
    for (const key of Object.keys(runs[0])) {
      summary[key] = median(runs.map(r => r[key]));
    }
    results[name] = summary;
  }
  return results;
}
