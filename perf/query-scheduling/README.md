# Query Scheduling Benchmark

Benchmarks the coordinator's query scheduling (see uwdata/mosaic#510) using a
mock connector with simulated, deterministic per-query latency.

## Scenarios

- **preaggregation** — 8 clients each materialize a pre-aggregation table
  (exec), await it, and read from it 3 times. Measures wall time and mean
  time until a client's reads complete. Exercises parallel submission of
  independent writes.
- **brushStorm** — 6 clients receive 5 interleaved rounds of update queries
  with jittered latency. Measures mean request-to-update latency and mean
  time until each client is fully updated. Exercises out-of-order result
  delivery across clients.
- **uniformReads** — 20 identical-latency independent reads. Parity check;
  both implementations should match.

## Running

Each checkout to benchmark needs `pnpm install` and `npx tsc --build`.

```sh
# current checkout only (prints JSON)
node perf/query-scheduling/run.mjs

# compare a baseline checkout (e.g. a worktree of main) with this one
node perf/query-scheduling/run.mjs /path/to/main-checkout .
```
