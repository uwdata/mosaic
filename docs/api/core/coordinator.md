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
* _cache_: Boolean flag to enable/disable query caching (default `true`).
* _consolidate_ Boolean flag to enable/disable query consolidation (default `true`).
* _preagg_: Pre-aggregation options object:
  * _enabled_: Boolean flag (default `true`) indicating if pre-aggregation optimizations should be used when possible.
  * _mode_: How materialized views are created, one of `'exec'` (default) or `'preagg'`. In `'exec'` mode the coordinator issues `CREATE SCHEMA` and `CREATE TABLE` statements itself. In `'preagg'` mode it sends a `preagg` command containing only the SELECT, and the server validates it, materializes it under a namespace the server owns, and returns the destination catalog, schema, and table; dependent queries wait for that reference before they are issued. This mode requires a [connector](./connectors) that supports the `preagg` command; of the bundled connectors only `RestConnector` does, and the others reject the command with an `unsupported_command` error.
  * _schema_: The database schema (default `'mosaic'`) in which materialized view tables are created in `'exec'` mode. Ignored, with a warning, in `'preagg'` mode.

``` js
const mc = new Coordinator(new RestConnector({ uri: 'http://localhost:3000/' }), {
  preagg: { mode: 'preagg' }
});
```

In `'preagg'` mode the coordinator keeps the SELECT for each table it has materialized and reuses the returned reference for identical SELECTs. It remembers up to 512 references, evicting the least recently used, and tracks up to 32 pending builds. Requests refused at that cap, failed builds, and builds exceeding two minutes fall back to base queries, and a failed SELECT is not retried for one minute. The query result cache is cleared whenever a materialization completes, since a rebuilt table may hold different rows under the same name. The coordinator never asks the server to drop a table; the server is responsible for bounding and reclaiming the tables it creates. Call `coordinator.preaggregator.reset()` before changing credentials or authorization scope on the connector so that references obtained under the old context are not reused; replacing the connector with [`databaseConnector()`](#databaseconnector) or a full [`clear()`](#clear) does this automatically.

## databaseConnector

`coordinator.databaseConnector(connector)`

Get or set the [_connector_](./connectors) used by the coordinator to issue queries to a backing data source.
Replacing the connector resets the pre-aggregator, forgetting any tables materialized through the previous connector.

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

Resets the state of the coordinator. Supports the following _options_:

- _clients_: A Boolean flag (default `true`) indicating if all current clients should be disconnected.
- _cache_: A Boolean flag (default `true`) indicating if the query cache should be cleared.

A full clear (both flags `true`) also resets the pre-aggregator.

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
