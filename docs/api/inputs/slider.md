# Slider

A slider input widget.

## slider {#slider-method}

`slider(options)`

Return a new slider component with the provided _options_.
Creates an instance of the [`Slider`](#slider-class) class, connects it to [`coordinator`](../core/coordinator), and returns the corresponding HTML element.

The supported options are:

- _as_: A `Param` or `Selection` that this slider should update. For a `Param`, the selected slider value is set to be the new param value. For a `Selection`, a selection clause will be added to the selection.
- _field_: The database column name to use within generated selection clause predicates. Defaults to the *column* option.
- _select_: The type of selection clause predicate to generate if the *as* option is a Selection.  If `'point'` (the default), the selection predicate is an equality check for the slider value. If `'interval'`, the predicate checks an interval from the minimum to the current slider value.
- _filterBy_: A selection to filter the database table indicated by the *from* option.
- _from_: The name of a database table to use as a data source for this widget. Used in conjunction with the *column* option. The minimum and maximum values of the column determine the slider range.
- _column_: The name of a database column whose values determine the slider range. Used in conjunction with the *from* option. The minimum and maximum values of the column determine the slider range.
- _label_: A text label for the slider input. If unspecified, the _column_ name (if provided) is used by default.
- _min_: The minimum slider value.
- _max_: The maximum slider value.
- _step_: The slider step, the amount to increment between consecutive values.
- _value_: The initial value of the slider. Defaults to the value of a param provided via the _as_ option.
- _width_: The width of the slider in pixels.
- _element_: The parent DOM element in which to place the slider elements. If undefined, a new `div` element is created.

### Examples

Create a new slider with options pulled from `table.foo` in the backing database:

``` js
slider({ from: "table", column: "foo", as: param })
```

Create a new slider with options provided explicitly:

``` js
slider({ as: selection, min: 0, max: 10, step: 1 })
```

## Slider {#slider-class}

`new Slider(options)`

Class definition for a slider input that extends [`MosaicClient`](../core/client).
The constructor accepts the same options as the [`slider`](#slider-method) method.

### element

`slider.element`

The HTML element containing the slider input.
