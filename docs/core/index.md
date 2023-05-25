# Mosaic Core

Let's talk about the Core API.

## Clients

Mosaic _Clients_ are responsible for publishing their data needs and performing data processing tasks&mdash;such as rendering a visualization&mdash;once data is provided by the Coordinator. Clients typically take the form of Web (HTML/SVG) elements, but are not required to.

Upon registration, the Coordinator calls the client `fields()` method to request a list of fields, consisting of table and column names as well as optional requested statistics such as the row count, null value count, or minimum and maximum values. If a client does not require any field information, it can provide an empty list. The Coordinator queries the Data Source for requested metadata (e.g., column type) and summary statistics, and returns them via the client `fieldInfo()` method.

Next, the Coordinator calls the client `query()` method. The return value may be a SQL query string or a structured object that produces a query upon string coercion. Mosaic includes a query builder API that simplifies the construction of complex queries while enabling query analysis without need of a parser. The `query` method takes a single argument: an optional `filter` predicate (akin to a SQL `WHERE` clause) indicating a data subset. The client is responsible for incorporating the filter criteria into the returned query. Before the Coordinator submits a query for execution, it calls `queryPending()` to inform the client. Once query execution completes, the Coordinator returns data via the client `queryResult()` method or reports an error via `queryError()`.

Clients can also request queries in response to internal events. The client `requestQuery(query)` method passes a specific query to the Coordinator with a guarantee that it will be evaluated.
The client `requestUpdate()` method instead makes throttled requests for a standard `query()`; multiple calls to `requestUpdate()` may result in only one query (the most recent) being serviced.
Finally, clients may expose a `filterBy` Selection property. The predicates provided by `filterBy` are passed as an argument to the client `query()` method.

## Coordinator

The _Coordinator_ is responsible for managing client data needs. Clients are registered via the Coordinator `connect(client)` method, and similarly removed using `disconnect()`. Upon registration, the event lifecycle begins. In addition to the `fields` and `query` calls described above, the Coordinator checks if a client exposes a `filterBy` property, and if so, adds the client to a _filter group_: a set of clients that share the same `filterBy` Selection. Upon changes to this selection (e.g., due to interactions such as brushing or zooming), the Coordinator collects updated queries for all corresponding clients, queries the Data Source, and updates clients in turn. This process is depicted in @fig:mosaic-timeline.

As input events (and thus Selection updates) may arrive at a faster rate than the system can service queries, the Coordinator also throttles updates for a filter group. If multiple updates arrive while a previous update is being serviced, intermediate updates will be dropped in favor of the most recent update. The Coordinator can additionally perform optimizations including caching and indexing, discussed later in @sec:optimizations.

## Data Source

The Coordinator submits queries to a _Data Source_ for evaluation, using an extensible set of database connectors. By default Mosaic uses DuckDB as its backing database and provides connectors for communicating with a DuckDB server via Web Sockets or HTTP calls, with DuckDB-WASM in the browser, or through Jupyter widgets to DuckDB in Python. For data transfer, we default to the binary Apache Arrow format, which enables efficient serialization of query results with no subsequent parsing overhead. While the socket and HTTP connectors also support JSON, this is more costly to serialize, results in larger payloads, and must be parsed on the client side.

## Params & Selections

_Params_ and _Selections_ support cross-component coordination.
Params are reactive variables that hold scalar values (accessible via the `value` property) and broadcast updates upon changes. Params can parameterize Mosaic clients and may be updated by input widgets.

A Selection is a specialized Param that manages one or more predicates (Boolean-valued query expressions), generalizing Vega-Lite's selection abstraction. Interaction components update selections by providing a _clause_, an object consisting of the _source_ component providing the clause, a set of _clients_ associated with the clause, a query _predicate_ (e.g, the range predicate `column BETWEEN 0 AND 1`), a corresponding _value_ (e.g., the range array `[0,1]`), and an optional _schema_ providing clause metadata.
Upon update, any prior clause with the same _source_ is removed and the new, most recent clause (called the _active_ clause) is added. Selections override the Param `value` property to return the active clause _value_, making Selections compatible where standard Params are expected.

Selections expose a `predicate(client)` function that takes a client as input and returns a correponding predicate for filtering the client's data. Selections apply a _resolution_ strategy to merge clauses into client-specific predicates. The _single_ strategy simply includes only the most recent clause. The _union_ strategy creates a disjunctive predicate, combining all clause _predicates_ via Boolean `OR`. Similarly, the _intersect_ strategy performs conjunction via Boolean `AND`. The _crossfilter_ strategy also performs conjunction, but omits clauses where the _clients_ set includes the input argument to the `predicate()` function. This strategy enables cross-filtering interactions that affect views other than the one currently being interacted with.

Both Params and Selections support `value` event listeners, corresponding to value changes. Selections additionally support `activate` events, which provide a clause indicative of likely future updates. For example, a brush interactor may trigger an activation event when the mouse cursor enters a brushable region, providing an example clause prior to any actual updates. Activation events can be used to implement optimizations such as prefetching.
