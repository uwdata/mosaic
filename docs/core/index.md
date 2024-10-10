<script setup>
import ParamExample from '../.vitepress/theme/ParamExample.vue';
import { useData } from 'vitepress';
const { isDark } = useData();
</script>

# Mosaic Core

The Mosaic `core` API includes a central _coordinator_ as well as _params_ and _selections_ for linking values or query predicates (respectively) across Mosaic _clients_. The coordinator can send queries over the network to a backing server (`socket` and `rest` clients) or to an in-browser DuckDB-WASM instance (`wasm` client).

<img v-if="isDark" src="/architecture-dark.png"/>
<img v-else src="/architecture.png"/>

The figure above illustrates a typical Mosaic setup.
The coordinator collects queries from clients, issues them to DuckDB, and returns the results to clients.
User interactions with a client can populate selections with filter clauses.
Upon selection updates, the coordinator determines filter queries and updates clients with the filtered data.

## Clients

Mosaic _clients_ are responsible for publishing their data needs and performing data processing tasks&mdash;such as rendering a visualization&mdash;once data is provided by the coordinator. Clients typically take the form of Web (HTML/SVG) elements, but are not required to. A Web element may even consist of multiple clients, such as multiple marks (chart layers) in [vgplot](/vgplot/).

Upon registration with a [`coordinator.connect(client)`](/api/core/coordinator.html#connect) call, the coordinator calls the client `fields()` method to request a list of column names and optional summary statistics. If a client does not require any field information, it can provide an empty list. The Coordinator queries the data source for requested metadata (e.g., column type) and statistics, and returns them via the client `fieldInfo()` method.

Next, the coordinator calls the client `query()` method. The return value may be a SQL query string or a structured object that produces a query upon string coercion. Mosaic includes a [query builder API](/sql/) that simplifies the construction of complex queries while enabling query analysis without need of a parser. The `query` method takes a single argument: an optional `filter` predicate (akin to a SQL `WHERE` clause) indicating a data subset. The client is responsible for incorporating the filter criteria into the returned query.

Before the coordinator submits a query for execution, it calls `queryPending()` to inform the client. Once query execution completes, the coordinator returns data via the client `queryResult()` method or reports an error via `queryError()`.

Clients can also request queries in response to internal events. The client `requestQuery()` method issues a query to the coordinator with a guarantee that it will be evaluated.
The `requestUpdate()` method makes throttled requests for a standard `query()`; multiple calls to `requestUpdate()` may result in only one query (the most recent) being serviced.
Finally, clients may expose a `filterBy` Selection property. The predicates provided by `filterBy` are passed as an argument to the client `query()` method by the coordinator.

[Client API Reference](/api/core/client)

## Coordinator

The _coordinator_ is responsible for managing client data needs. Clients are registered via the coordinator `connect(client)` method, and similarly removed using `disconnect()`. Upon registration, the event lifecycle begins.
In addition to the `fields` and `query` calls described above, the coordinator checks if a client exposes a `filterBy` property, and if so, adds the client to a _filter group_: a set of clients that share the same `filterBy` selection.
Upon changes to this selection (e.g., due to interactions such as brushing or zooming), the coordinator collects updated queries for all corresponding clients, queries the data source, and updates clients in turn.
The Coordinator additionally performs optimizations including caching and pre-aggregation.

[Coordinator API Reference](/api/core/coordinator)

## Data Source

The coordinator submits queries to a _data source_ using an extensible set of database connectors.
Mosaic uses [DuckDB](/duckdb/) as a backing database and provides connectors for communicating with a DuckDB server via Web Sockets or HTTP calls, with DuckDB-WASM in the browser, or through [Jupyter widgets](/jupyter/) to DuckDB in Python.
To transfer data, Mosaic uses [Apache Arrow](https://arrow.apache.org/) for efficient serialization of query results with no subsequent parsing overhead.
While the socket and HTTP connectors also support JSON, this is more costly to serialize, results in larger payloads, and must be parsed on the client side.

[Connectors API Reference](/api/core/connectors)

## Params

_Params_ support cross-component coordination.
Params are reactive variables that hold scalar values (accessible via the `value` property) and broadcast updates upon changes.
Params support `value` event listeners, corresponding to value changes.
Params can parameterize Mosaic clients and may be updated by input widgets or other interactors.

<ParamExample />

``` js
import { hconcat, slider } from "@uwdata/vgplot";
import { Param } from "@uwdata/mosaic-core";

// create a new Param
const param = Param.value(5);

// bind two sliders (with different ranges!) to the param
hconcat(
  slider({ label: 'Param', min: 0, max: 10, step: 1, as: param }),
  slider({ min: 0, max: 15, step: 1, as: param })
)
```

[Param API Reference](/api/core/param)

## Selections

A _selection_ is a specialized param that manages one or more _predicates_: Boolean-valued query expressions.
Selections expose a `predicate(client)` function that takes a client as input and returns a resolved predicate for filtering the client's data.

Interaction components update selections by providing a _clause_, an object consisting of the _source_ component providing the clause, a set of _clients_ associated with the clause, a query _predicate_ (e.g, the range predicate `column BETWEEN 0 AND 1`), a corresponding _value_ (e.g., the range array `[0,1]`), and an optional _schema_ providing clause metadata.
Upon update, any prior clause with the same _source_ is removed and the new, most recent clause (called the _active_ clause) is added.

Selections apply a _resolution_ strategy to merge clauses into client-specific predicates:

- The `single` strategy simply includes only the most recent clause.
- The `union` strategy performs disjunction, combining all predicates via Boolean `OR`.
- The `intersect` strategy performs conjunction via Boolean `AND`.

In addition, selections can be _cross-filtered_, so that they affect views other than the one currently being interacted with.
The strategies above are modified to omit clauses where the _clients_ set includes the input argument to the `predicate()` function.

``` js
import { Selection } from "@uwdata/mosaic-core";

// Create a Selection with "single" resolution strategy
Selection.single()

// Create a Selection with "union" resolution strategy
Selection.union()

// Create a Selection with "intersect" resolution strategy
Selection.intersect()

// A shorthand for "intersect" with cross-filtering
Selection.crossfilter()

// A single Selection that applies cross-filtering
Selection.single({ cross: true })
```

Selections override the `Param.value` property to return the active clause _value_, making selections compatible where standard params are expected.
Like params, selections support `value` event listeners, corresponding to value changes.

Selections additionally support `activate` events, which provide a clause indicative of likely future updates.
For example, a brush interactor may trigger an activation event when the cursor enters a brushable region, providing an example clause prior to any actual updates.
Activation events are used to implement optimizations such as prefetching.

[Selection API Reference](/api/core/selection)
