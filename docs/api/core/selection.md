# Selection

A `Selection` is a specialized [`Param`](./param) that manages a collection of Boolean-valued predicates that can be used to interactively filter a data source.

Selections apply a _resolution_ strategy to merge clauses into client-specific predicates:

- The `single` strategy simply includes only the most recent clause.
- The `union` strategy performs disjunction, combining all predicates via Boolean `OR`.
- The `intersect` strategy performs conjunction via Boolean `AND`.

In addition, selections can be _cross-filtered_, so that they affect views other than the one currently being interacted with.
The strategies above are modified to omit clauses where the _clients_ set includes the input argument to the `predicate()` function.

## isSelection

`isSelection(value)`

Returns `true` if the input value is a `Selection`, false otherwise.

## Selection.intersect

`Selection.intersect(options)`

Create a new Selection instance with an intersect (conjunction) resolution strategy.

The _options_ object may include a Boolean _cross_ flag (default `false`) indicating cross-filtered resolution. If true, selection clauses will not be applied to the clients they are associated with.

## Selection.union

`Selection.union(options)`

Create a new Selection instance with a union (disjunction) resolution strategy.

The _options_ object may include a Boolean _cross_ flag (default `false`) indicating cross-filtered resolution. If true, selection clauses will not be applied to the clients they are associated with.

## Selection.single

`Selection.single(options)`

Create a new Selection instance with a singular resolution strategy that keeps only the most recent selection clause.

The _options_ object may include a Boolean _cross_ flag (default `false`) indicating cross-filtered resolution. If true, selection clauses will not be applied to the clients they are associated with.

## Selection.crossfilter

`Selection.crossfilter()`

Create a new Selection instance with a cross-filtered intersect resolution strategy.
This is a convenience method for `Selection.intersect({ cross: true })`.

## clone

`selection.clone()`

Create a cloned copy of this Selection instance.

## remove

`selection.remove(source)`

Create a clone of this Selection with clauses corresponding to the provided _source_ removed.

## active

`selection.active`

Property getter for the current active (most recently updated) selection clause.

## value

`selection.value`

The value corresponding to the current active selection clause.
Selections override the [`Param.value`](./param#value) property to return the active clause _value_, making selections compatible where standard params are expected.

## clauses

`selection.clauses`

The current array of selection clauses.

## activate

`selection.activate(clause)`

Emit an `activate` event with the given selection clause.

These `activate` events provide a clause indicative of likely future updates.
For example, a brush interactor may trigger an activation event when the cursor enters a brushable region, providing an example clause prior to any actual updates.
Activation events can be used to implement optimizations such as prefetching.

## update

`selection.update(clause)`

Update the selection with a new selection _clause_. A _clause_ is an object consisting of:

- the _source_ component (such as a client or interactor) providing the clause,
- a set of _clients_ associated with the clause, indicating the clients that should be skipped in the case of cross-filtering,
- a query _predicate_ (e.g, the range predicate `column BETWEEN 0 AND 1`),
- a corresponding _value_ (e.g., the range array `[0,1]`), and
- an optional _schema_ providing clause metadata.

Upon update, any prior clause with the same _source_ is removed and the new, most recent clause (called the _active_ clause) is added.

## predicate

`selection.predicate(client)`

Return a selection query predicate for the given Mosaic _client_.
The resulting predicate can be used as part of a SQL `WHERE` clause.

## addEventListener

`selection.addEventListener(type, callback)`

Add an event listener _callback_ function for the specified event _type_.
Selections support both `"value"` and `"activate"` type events.

## removeEventListener

`selection.removeEventListener(type, callback)`

Remove an event listener _callback_ function for the specified event _type_.
