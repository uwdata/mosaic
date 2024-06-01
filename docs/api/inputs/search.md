# Search

A text searchbox input widget.

## search {#search-method}

`search(options)`

Return a new search component with the provided _options_.
Creates an instance of the [`Search`](#search-class) class, connects it to [`coordinator`](../core/coordinator), and returns the corresponding HTML element.

The supported options are:

- _as_: A `Param` or `Selection` that this search box should update. If a `Param`, simply sets the param to the input query string. If a `Selection`, adds a predicate that searches for the input text value, as determined by the _type_ option.
- _field_: The database column name to use within generated selection clause predicates. Defaults to the *column* option.
- _type_: The type of text search query to perform. One of:
  - `"contains"` (default): the query string may appear anywhere in the text
  - `"prefix"`: the query string must appear at the start of the text
  - `"suffix"`: the query string must appear at the end of the text
  - `"regexp"`: the query string is a regular expression the text must match
- _filterBy_: A selection to filter the database table indicated by the *from* option.
- _from_: The name of a backing database table to use as an autocomplete data source for this widget. Used in conjunction with the *column* option.
- _column_: The name of a database column from which to pull valid search results. The unique column values are used as search autocomplete values. Used in conjunction with the *from* option.
- _label_: A text label for this input.
- _element_: The parent DOM element in which to place the search elements. If undefined, a new `div` element is created.

### Examples

Create a new search box with autocomplete values pulled from `table.foo` in the backing database:

``` js
search({ from: "table", column: "foo", as: selection })
```

## Search {#search-class}

`new Search(options)`

Class definition for a search box input that extends [`MosaicClient`](../core/client).
The constructor accepts the same options as the [`search`](#search-method) method.

### element

`search.element`

The HTML element containing the search box input.
