# JSON Specifications

Both individual plots and interactive dashboards can be defined using declarative specifications in either [JSON](https://en.wikipedia.org/wiki/JSON) or [YAML](https://en.wikipedia.org/wiki/YAML) format.

The code below shows an example specification in both YAML and JSON formats, as well as corresponding JavaScript code produced by [`astToESM`](parser-generators#asttoesm).
To parse a JSON specification use [`parseSpec`](parser-generators##parsespec).
To generate a running application from a parsed spec, use [`astToDOM`](parser-generators#asttodom).

::: code-group
<<< @/public/specs/yaml/bias.yaml [YAML]
<<< @/public/specs/json/bias.json [JSON]
<<< @/public/specs/esm/bias.js [JavaScript]
:::

::: tip
The [TypeScript types in the `@uwdata/mosaic-spec` package](https://github.com/uwdata/mosaic/tree/main/packages/spec/src/spec) provide comprehensive documentation of Mosaic declarative specifications.
:::

## Specification Format

At the top-level, a specification may contain the following keys:

``` json
{
  "meta": { /* optional metadata */ },
  "config": { /* optional configuration */ },
  "data": { /* input data definitions */ },
  "params": { /* param and selection definitions */ },
  ... /* top-level element properties */
}
```

### Metadata

The `meta` object can contain arbitrary metadata information. Commonly used properties include `title` (the specification title), `description` (a longer text description), and `credit` (acknowledgements).

### Configuration

The `config` object specifies additional configuration. At present the only supported property is `extensions`, a string or string array indicating DuckDB extensions to load.

The following snippet loads the DuckDB `spatial` extension, which provides support for geometric data, projections, and spatial operations:

```json
"config": {
  "extensions": "spatial"
}
```

Additional configuration properties may be added in the future.

### Data Definitions

Data definitions consist of an object where keys indicate dataset names and values describe the data.
Both SQL queries and external files (and combinations thereof) are supported.
The keys are order-sensitive, as some datasets may be derived from another.

``` json
{
  // a string value is interpreted as a query
  "queryData": "SELECT * FROM existingTable",

  // load a tab-delimited csv file
  "csvData": { "file": "data.csv", "delimiter": "\t" },

  // load a json file, with explicit data type
  "jsonData": { "file": "data.json", "type": "json" },

  // load a parquet file, queried upon load
  "parquetData": {
    "file": "data.parquet",
    "select": ["foo", "bar"],
    "where": "baz > 5"
  }
}
```

The `file` key indicates files relative to the current directory (whether in the browser, or where a data server was launched locally).
Most file types (`"csv"`, `"json"`, `"parquet"`) are inferred by file extenstion, but can be provided using the `type` key.

Data definitions can also include parameters.
In the example above, the table `"csvData"` includes a `delimiter` parameter, while the new table `"parquetData"` is created by first filtering rows and selecting a subset of columns from the source data.
See the [data loading methods](../sql/data-loading) for the supported options.

### Params & Selections

Param and selection definitions consist of an object where keys indicate the name and values provide the definition.
The keys are order-sensitive, as some params may be derived from another.
To refer to a param or selection later in the specification, use a `$`-prefixed name such as `$paramName`.

``` json
{
  "scalarParam": 5, // literal values map to params
  "arrayParam": [0, "$scalarParam"], // derived array-valued param

  // selection definitions are objects with a "select" key
  "singleSelection": { "select": "single" },
  "unionSelection": { "select": "union" },
  "intersectSelection": { "select": "intersect" },
  "crossfilterSelection": { "select": "crossfiltter" }
}
```

If a param reference is used in a specifcation but not defined, a new `intersect` selection with a matching name is created.

### Layout

To layout elements, use objects with `hconcat` or `vconcat` keys, like so:

``` json
{
  "hconcat": [
    ...elements
  ]
}
```

To add spacing, use an object with an `hspace` or `vspace` key:

``` json
{
  "vconcat": [
    /* ...elements */
    { "vspace": "1em" } // or use a number for pixels
    /* ...more elements */
  ]
}
```

### Inputs

To specify an input, use an object with an `input` key whose value is the corresponding input type.
The remaining keys should be valid input options.

``` json
{
  "input": "slider",
  "as": "$param",
  "min": 0,
  "max": 100,
  "step": 10
}
```

### Plot

To specify a plot, use an object with a `plot` key whose value is an array of mark, interactor, or legend specifications.
The remaining top-level keys in the plot object should be attribute names.

``` json
{
  "plot": [
    {
      "mark": "dot",
      "data": { "from": "tableName", "filterBy": "$selection" },
      "x": "foo", // x-encode values of column "foo"
      "y": "bar", // y-encode values of column "bar"
      "r": { "sql": "SQRT($areaParam)" }, // size based on an expression
      "fill": "$colorParam" // set fill color to a param value
    },
    { "select": "intervalXY", "as": "$selection" },
    { "select": "highlight", "by": "$selection" }
  ],
  "yAxis": "right",
  "width": 500,
  "height": 500
}
```

Mark entries include a `mark` key whose value should be the mark type, a `data` key indicating the input data, and the remaining keys should be mark options such as encoding channels.
Interactors are defined similarly, but using the `select` key.

SQL expressions can be defined as objects with a single `sql` key.
Param references (as in `"1 + $param"`) will be parsed and resolved.
By default, param references evaluate to SQL literal values.
To instead use a param to refer to a column name, use `$$` syntax: `"1 + $$param"`.

### Legends

Standalone legends are defined using an object with a `legend` key:

``` json
{
  "legend": "color", // legend type
  "for": "plotName" // the plot _must_ have a name attribute
}
```
