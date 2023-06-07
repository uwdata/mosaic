# Table

A sortable, scrollable table component that loads data on demand from a backing database table.

## table {#table-method}

`table(options)`

Return a new table component with the provided _options_.
Creates an instance of the [`Table`](#table-class) class, connects it to [`coordinator`](../core/coordinator), and returns the corresponding HTML element.

The supported options are:

- _filterBy_: An optional selection by which to filter the contents of the table view.
- _from_: The name of the backing database table or view.
- _columns_: An ordered array of columns to include. If unspecified, all columns will be included.
- _align_: An object providing optional column -> alignment mappings. The supported alignment values are `"left"`, `"center"`, and `"right"`. If a column's alignment is not specified, a default alignment is chosen based on the data type.
- _format_: An object providing optional column -> format function mappings. If provided, a format function will be invoked with the column value to produce a string to display. If a column's formatting is not provided, a default format is chosen based on the data type.
- _width_: If a number, sets the width of the table view in pixels. If an object, provides a column name -> pixel width mapping for individual columns.
- _maxWidth_: The maximum width of the full table view in pixels.
- _height_: The height of the table view in pixels (default 500).
- _rowBatch_: The number of additional rows to query upon scroll updates (default 100).
- _element_: The container DOM element. If unspecified, a new `div` is created.

## Table {#table-class}

`new Table(options)`

Class definition for a table component that extends [`MosaicClient`](../core/client).
The constructor accepts the same options as the [`table`](#table-method) method.

### element

`table.element`

The HTML element containing the table view.

