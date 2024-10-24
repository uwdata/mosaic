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
* _preagg_: Pre-aggregation options object. The _enabled_ flag (default `true`) determines if pre-aggregation optimizations should be used when possible. The _schema_ option (default `'mosaic'`) indicates the database schema in which materialized view tables should be created for pre-aggregated data.

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
A logger instance must support `log`, `info`, `warn`, and `error` mehthods.
If set to `null`, logging will be suppressed.

## clear

`coordinator.clear(options)`

Resets the state of the coordinator. Supports the following _options_:

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
A query result table will be returned, with format determined by the _type_ options.
The input _query_ should produce a SQL query upon string coercion.

The supported _options_ are:

- _type_: The return format type. One of `"arrow"` (default) or `"json"`.
- _cache_: A Boolean flag (default `true`) indicating if the query result should be cached.
- _priority_: A value indicating the query priority, one of: `Priority.High`, `Priority.Normal` (the default), or `Priority.Low`.

Any additional options will be passed through to the backing database.
For example, the Mosaic [data server](../duckdb/data-server) will respect a _persist_ option to cache the result on the server's local file system.

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
