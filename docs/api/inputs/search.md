# Search

A text searchbox input widget.

## search {#search-method}

`search(options)`

Return a new search component with the provided _options_.
Creates an instance of the [`Search`](#search-class) class, connects it to [`coordinator`](../core/coordinator), and returns the corresponding HTML element.

The supported options are:

- _as_: A `Param` or `Selection` that this search box should update. If a `Param`, simply sets the param to the input query string. If a `Selection`, adds a predicate that searches for the input text value, as determined by the _type_ option.
- _type_: The type of text matching to perform, one of `"contains"` (default), `"prefix"`, `"suffix"`, or `"regexp"` (regular expression) matching.
- _from_: The name of the backing database table or view. If specified alongside the _column_ options, the autocomplete options will be set to the distinct column values.
- _column_: The backing database column to search over.
- _label_: A text label for the search box input.

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
