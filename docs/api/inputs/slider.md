# Slider

A slider input widget.

## slider {#slider-method}

`slider(options)`

Return a new slider component with the provided _options_.
Creates an instance of the [`Slider`](#slider-class) class, connects it to [`coordinator`](../core/coordinator), and returns the corresponding HTML element.

The supported options are:

- _as_: A `Param` or `Selection` that this slider should update. For a `Param`, the selected slider value is set to be the new param value. For a `Selection`, a predicate of the form `column = value` will be added to the selection.
- _from_: The name of the backing database table or view.
- _column_: The backing database column this slider represents. If specified, the slider range will be set to the minimum and maximum column values.
- _label_: A text label for the slider input. If unspecified, the _column_ name (if provided) will be used by default.
- _min_: The minimum slider value.
- _max_: The maximum slider value.
- _step_: The increment to apply between adjacent slider values.
- _value_: The initial value of the slider. Defaults to the value of any param or selection provided via the _as_ option.
- _width_: The width of the slider in pixels.
- _element_: The container DOM element. If unspecified, a new `div` is created.

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
