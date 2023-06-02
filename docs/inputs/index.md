<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Mosaic Inputs

Inspired by [Observable Inputs](https://observablehq.com/@observablehq/inputs), the Mosaic `inputs` pacakage includes a set of input widgets and a table viewer.
Each input widget is a Mosaic client that uses params or selections for linked interactions.

This example dashboard of Olympic athlete statistics uses `menu` and `search` inputs to filter the display, including the scrollable and sortable `table` below.
The contents of the menus and the autocomplete options for the search box are populated from the backing database.
Each of these widgets then populate a shared selection.

<Example spec="/specs/yaml/athletes.yaml"/>

_Scroll the table to load more data on demand.<br/>Click a column header to sort, or command-click to clear sort criteria._

## Slider, Menu, and Search

The `slider`, `menu`, and `search` inputs support dual modes of operation: they can be manually configured or they can be backed by a database table.
If a backing table and column are specified, the `slider` queries for the minimum and maximum column values to parameterize the slider.
The `menu` and `search` components instead query for distinct column values, and use those to populate the menu or autocomplete options, respectively.

This snippet defines the menus and search box in the example above:

``` js
import { hconcat, menu, search, Selection } from "@uwdata/vgplot";
const query = Selection.intersect();
hconcat(
  menu({ label: "Sport", as: query, from: "athletes", column: "sport" }),
  menu({ label: "Sex", as: query, from: "athletes", column: "sex" }),
  search({ label: "Name", as: query, from: "athletes", column: "name", type: "contains" })
)
```

All input widgets can write updates to a provided param or selection.
Param values are updated to match the input value.
Selections are provided a predicate clause. This linking can be bidirectional: an input component will also subscribe to a param and track its value updates.
Two-way linking is also supported for selections using _single_ resolution, where there is no ambiguity regarding the value.

## Table

The `table` component provides a sortable, scrollable table grid view.
If backing columns are specified, the table first requests metadata for those columns.
If no explicit columns are listed, the component will instead request _all_ backing table columns.
The returned metadata is used to populate the table header and guide formatting and alignment.

This snippet shows how the table is defined in the example above.
In this case, explicit column names and column pixel widths are provided.

``` js
import { table } from "@uwdata/vgplot";
table({
  from: "athletes",
  filterBy: query,
  columns: [ "name", "nationality", "sex", "height", "weight" ,"sport" ],
  width: { "name": 180, "nationality": 100, "sex": 50, "height": 50, "weight": 50, "sport": 100 },
  height: 250
})
```

To avoid overwhelming the browser, the table query method requests rows in batches using SQL `LIMIT` and `OFFSET` clauses.
As a user scrolls the table view, the component requests the next data batch with the proper offset.

Table components are sortable: clicking a column header toggles ascending and descending order.
When sort criteria change, the current data is dropped and a request is made to fetch a sorted data batch.
As a user scrolls, these sort criteria persist.

If provided, a `filterBy` Selection is used to filter table content.

<!-- Tables can also be used for input: a user may select rows to update a Selection with a predicate selecting rows by either primary key or value equality. -->
