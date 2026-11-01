# Coordinator

The Mosaic coordinator manages queries for Mosaic clients.
Internally, the coordinator includes a query manager that maintains a queue of query requests that are issued through a database [connector](./connectors).
The coordinator also manages _filter groups_: collections of clients that share the same [`filterBy`](./client#filterby) selection. The coordinator responds to selection changes and provides coordinated updates to all linked clients.
Where possible, the coordinator also applies optimizations, such as caching and building optimized indices for filter groups involving supported aggregation queries.

## coordinator {#coordinator-global}

`coordinator()`

Get the default global coordinator instance.

## constructor

`new Coordinator(connector, options)`

Create a new Mosaic Coordinator to manage all database communication for clients and handle selection updates. Accepts a database _connector_ and an _options_ object:

* _logger_: The logger to use, defaults to `console`.
* _cache_: Boolean flag to enable/disable query caching (default `true`), or a cache object such as `lruCache({ maxBytes })` to use a custom budget. See [Query cache](#query-cache).
* _ipc_: Arrow IPC extraction options used when decoding `"arrow"` query results. If unspecified, date and timestamp values are extracted as JavaScript `Date` objects. Setting new options on the query manager clears the query cache.
* _timeout_: The query timeout in milliseconds (default none). A query that does not complete in time is rejected with a `TimeoutError`, and its connector request is aborted. The clock starts when the query is sent to the connector, not while it waits in the queue. The timeout applies to every query, including `exec` queries that load data or build pre-aggregated tables, so choose a value above the slowest of these. A timed-out `exec` query can still take effect in the database, and later queries wait until the connector stops or completes it.
* _consolidate_ Boolean flag to enable/disable query consolidation (default `true`).
* _preagg_: Pre-aggregation options object. The _enabled_ flag (default `true`) determines if pre-aggregation optimizations should be used when possible. The _schema_ option (default `'mosaic'`) indicates the database schema in which materialized view tables should be created for pre-aggregated data. The _useSketches_ flag (default `false`) enables pre-aggregation of distinct count and quantile aggregates by approximating them with mergeable sketches, as described below. The _enabled_, _schema_, and _useSketches_ settings can also be changed later via properties of `coordinator.preaggregator`.

### Sketch aggregates

Exact distinct counts and quantiles can not be computed by merging partial results, so by default queries containing `count(DISTINCT ...)`, `median`, or `quantile` aggregates are not pre-aggregated. When _useSketches_ is `true`, Mosaic instead approximates these aggregates using mergeable sketches from the DuckDB [`datasketches` community extension](https://duckdb.org/community_extensions/extensions/datasketches), which it installs and loads as needed. Pre-aggregated tables store one sketch per bin, and selection updates merge the sketches of the selected bins.

* `count(DISTINCT x)` and `approx_count_distinct(x)` use a [HyperLogLog sketch](https://datasketches.apache.org/docs/HLL/HllSketches.html) (`lg_k = 12`, about 1.6% relative standard error), rounded to the nearest integer. Input values are hashed, so any column type is supported.
* `median(x)`, `quantile(x, p)`, `quantile_cont(x, p)`, `quantile_disc(x, p)` and `approx_quantile(x, p)` use a [KLL sketch](https://datasketches.apache.org/docs/KLL/KLLSketch.html) (`k = 200`, about 1.65% normalized rank error). The quantile probability _p_ must be a single number literal. Results are values from the input data (no interpolation), so for example the median of `[3, 4]` is `3` rather than `3.5`. KLL sketches support numeric inputs only; for other types (such as dates) the pre-aggregated table can not be created, so Mosaic logs an error and falls back to standard queries.

Queries that use sketch aggregates directly, such as [`hllSketch`](../sql/aggregate-functions#hllsketch) or [`kllSketch`](../sql/aggregate-functions#kllsketch), are pre-aggregated regardless of the _useSketches_ setting.

## Query cache

`lruCache(options)`

Create the least-recently-used query cache the coordinator uses by default. The budget counts the Arrow IPC bytes returned by the connector, and a result larger than the budget is not cached. Supports the following _options_:

- _maxBytes_: The maximum number of bytes to retain (default 256 MiB).

A custom cache object must implement `get(key)`, `set(key, value, bytes)`, `clear()`, and `bytes()`, where `bytes()` returns the total bytes currently charged to the cache.

## databaseConnector

`coordinator.databaseConnector(connector)`

Get or set the [_connector_](./connectors) used by the coordinator to issue queries to a backing data source.

## connect

`coordinator.connect(client)`

Connect a [_client_](./client) to this coordinator.
Upon connection, the [client lifecycle](/core/) will initiate.
If the client exposes a `filterBy` selection, the coordinator will handle updates to the client when the selection updates.

## disconnect

`coordinator.disconnect(client)`

Disconnect the [_client_](./client) from the coordinator and remove all update handling.

## logger

`coordinator.logger(logger)`

Get or set the coordinator's logger.
The logger defaults to the standard JavaScript `console`.
A logger instance must support `log`, `info`, `warn`, and `error` methods.
If set to `null`, logging will be suppressed.

## clear

`coordinator.clear(options)`

Resets the state of the coordinator. Pending queries are rejected, and in-flight queries other than `exec` queries are aborted. Supports the following _options_:

- _clients_: A Boolean flag (default `true`) indicating if all current clients should be disconnected.
- _cache_: A Boolean flag (default `true`) indicating if the query cache should be cleared.

## exec

`coordinator.exec(query, options)`

Request a _query_ and return a request Promise that resolves when the query is complete.
No query result will be returned.
The input _query_ should produce a SQL query upon string coercion.

The supported _options_ are:

- _priority_: A value indicating the query priority, one of: `Priority.High`, `Priority.Normal` (the default), or `Priority.Low`.

## query

`coordinator.query(query, options)`

Request a _query_ and return a request Promise that resolves when the query is complete.
An Arrow table will be returned.
The input _query_ should produce a SQL query upon string coercion.

The supported _options_ are:

- _cache_: A Boolean flag (default `true`) indicating if the query result should be cached.
- _priority_: A value indicating the query priority, one of: `Priority.High`, `Priority.Normal` (the default), or `Priority.Low`.

Any additional options will be passed through to the backing database.

## prefetch

`coordinator.prefetch(query, options)`

Request a _query_ to prefetch the results for later use, and return a request Promise that resolves when the query is complete. This method accepts the same _options_ as [`query()`](#query), except that the _cache_ flag will always be true and the _priority_ flag will always be `Priority.Low`.

If prefetch requests are no longer needed, the [`cancel`](#cancel) method can be used to drop any queued but not yet issued queries.

## cancel

`coordinator.cancel(requests)`

Cancel the provided query _requests_, a list of one or more request Promise instances returned by earlier `exec`, `query`, or `prefetch` calls.

## updateClient

`coordinator.updateClient(client, query, priority)`

Initiate a _client_ update for a given _query_ and _priority_ (default `Priority.Normal`), and return a Promise that resolves when the query is complete.
The [`client.queryPending()`](./client#querypending) method will be invoked, followed by [`client.queryResult()`](./client#queryresult) or [`client.queryError()`](./client#queryerror) upon completion.

::: warning
This method is used internally, application code should _not_ call this method directly.
:::

## requestQuery

`coordinator.requestQuery(client, query)`

Request a query update for the provided _client_.
If the _query_ argument is provided, [`updateClient()`](#updateclient) is invoked.
Otherwise, the client [`update()`](./client#update) method is called immediately.

::: warning
This method is used internally, application code should _not_ call this method directly.
:::
