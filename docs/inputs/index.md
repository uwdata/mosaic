# Mosaic Inputs

Inspired by [Observable inputs](https://observablehq.com/@observablehq/inputs), the Mosaic `inputs` pacakage includes a set of input widgets and a table viewer.
Each input is a Mosaic client that uses Params and Selections for linked interactions.

The `slider`, `menu`, and `search` inputs support dual modes of operation: they can be manually configured or they can be backed by a database table.
If a backing table and column are specified, the `slider` queries for the minimum and maximum column values to parameterize the slider.
The `menu` and `search` components instead query for distinct column values, and use those to populate the menu or autocomplete options, respectively.

All input widgets can write updates to a provided Param or Selection.
Param values are updated to match the input value.
Selections are provided a predicate clause. This linking can be bidirectional: an input component will also subscribe to a Param and track its value updates.
Two-way linking is also supported for Selections using _single_ resolution, where there is no ambiguity regarding the value.

The `table` component provides a sortable, scrollable table grid view.
If a set of backing columns is provided, the table first requests metadata for those columns.
If a backing table is provided without explicit columns, the component will instead request _all_ table columns.
The returned metadata is used to populate the table header and guide formatting and alignment by column type.
To avoid overwhelming the browser, the table query method requests rows in batches using SQL `LIMIT` and `OFFSET` clauses.
As a user scrolls the table view, the component requests the next data batch with the proper offset.

Table components are sortable: clicking a column header toggles ascending and descending order.
When sort criteria change, the current data is dropped and a request is made to fetch a sorted data batch.
As a user scrolls, these sort criteria persist.

If provided, a `filterBy` Selection is used to filter table content.
Tables can also be used for input: a user may select rows to update a Selection with a predicate selecting rows by either primary key or value equality.
