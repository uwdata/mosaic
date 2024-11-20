# Client

The `MosaicClient` class provides a base class for client implementation.
Clients are responsible for publishing their data needs and performing data processing tasks&mdash;such as rendering a visualization&mdash;once data is provided by the [coordinator](./coordinator).

If you are interested in creating your own Mosaic clients, see the [Mosaic GitHub repository](https://github.com/uwdata/mosaic).
For concrete examples, start with the source code of [Mosaic inputs](https://github.com/uwdata/mosaic/tree/main/packages/inputs/src).

## constructor

`new MosaicClient(filterSelection)`

Create a new client instance. If provided, the [Selection](./selection)-valued _filterSelection_ argument will be exposed as the client's [`filterBy`](#filterby) property.

## filterBy

`client.filterBy`

Property getter for the Selection that should filter this client.
The [coordinator](./coordinator) uses this property to provide automatic updates to the client upon selection changes.

## filterStable

`client.filterStable`

Property getter for a Boolean value indicating if the client query can be safely optimized using a pre-aggregated materialized view.
This property should return true if changes to the `filterBy` selection do not change the groupby (e.g., binning) values of the client query.

The `MosaicClient` base class will always return `true`.
Subclasses should override the property getter to provide more nuanced results as needed.

## fields

`client.fields()`

Return an array of field requests, called by the [coordinator](./coordinator) when the client is first connected.
Each field request should be an object with `table` and `column` properties.
The coordinator will then return column metadata via the client [`fieldInfo()`](#fieldinfo) method.

The `MosaicClient` base class will always return `null`, indicating no field metadata is needed.
Subclasses should override this method to provide more nuanced results as needed.

## fieldInfo

`client.fieldInfo(info)`

Called by the [coordinator](./coordinator) to set the field information for this client.
The _info_ argument will be an array of objects with the table name, column name, and type information.

The `MosaicClient` base class does nothing here.
Subclasses should override this method to process and retain field information as needed.

## query

`client.query(filter)`

Return a query specifying the data needed by this client, incorporating any requested _filter_ criteria.
If provided, the _filter_ argument should consist of Boolean-valued SQL predicates, suitable for inclusion in a `WHERE` clause.

The `MosaicClient` base class simply returns `null`.
Subclasses should override this method to provide a query, typically constructed using [Mosaic SQL builder](/sql/) utilities.

## queryPending

`client.queryPending()`

Called by the [coordinator](./coordinator) to inform the client that a query is pending.
The _info_ argument will be an array of objects with the table name, column name, and type information.
This method should return the current client instance.

The `MosaicClient` base class does nothing here.
Subclasses should override this method as needed.

## queryResult

`client.queryResult(data)`

Called by the [coordinator](./coordinator) to return query results in the form of a _data_ table. This method should return the current client instance.

The `MosaicClient` base class does nothing here.
Subclasses should override this method as needed.

## queryError

`client.queryError(error)`

Called by the [coordinator](./coordinator) to report that an _error_ occurred during query processing. This method should return the current client instance.

The `MosaicClient` base class reports the error to `console.error`.
Subclasses should override this method as needed.

## update

`client.update()`

Requests that a client update using its current data, for example to (re-)render an interface component, and returns the current client instance.
Called by the [coordinator](./coordinator) after returning data via the [`queryResult`](#queryresult) method.

The `MosaicClient` base class does nothing here.
Subclasses should override this method as needed.

## requestQuery

`client.requestQuery(query)`

Requests that the [coordinator](./coordinator) execute a query for this client, and returns a Promise that resolves upon query completion or error.
If an explicit query is not provided, the client [`query`](#query) method will be called, filtered by the current [`filterBy`](#filterby) selection.

## requestUpdate

`client.requestUpdate()`

Request that the [coordinator](./coordinator) perform a throttled update of this client using the default query provided by the [`query`](#query) method.
Unlike [`requestQuery`](#requestquery), for which every call will result in an executed query, multiple calls to `requestUpdate` may be consolidated.
