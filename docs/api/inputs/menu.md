# Menu

A dropdown menu input widget.

## menu {#menu-method}

`menu(options)`

Return a new menu component with the provided _options_.
Creates an instance of the [`Menu`](#menu-class) class, connects it to [`coordinator`](../core/coordinator), and returns the corresponding HTML element.

The supported options are:

- _as_: A `Param` or `Selection` that this menu should update. For a `Param`, the selected menu value is set to be the new param value. For a `Selection`, a predicate of the form `column = value` will be added to the selection.
- _field_: The database column name to use within generated selection clause predicates. Defaults to the *column* option.
- _filterBy_: An optional selection by which to filter the content of the menu, if drawn from a backing table.
- _from_: The name of a backing database table to use as a data source of menu options. Used in conjunction with the *column* option.
- _column_: The name of a backing database column from which to pull menu options. The unique column values are used as menu options. Used in conjunction with the *from* option.
- _label_: A text label for the menu input. If unspecified, the *column* name (if provided) will be used by default.
- _format_: A format function that takes an option value as input and generates a string label. The format function is not applied when an explicit label is provided in an option object.
- _options_: An array of menu options, as literal values or option objects. Option objects have a `value` property and an optional `label` property. If no label or *format* function is provided, the string-coerced value is used.
- _value_: The initial selected menu value.
- _element_: The parent DOM element in which to place the menu elements. If undefined, a new `div` element is created.

### Examples

Create a new menu with options pulled from `table.foo` in the backing database:

``` js
menu({ from: "table", column: "foo", as: param })
```

Create a new menu with options provided explicitly:

``` js
menu({
  as: selection,
  options: [
    { label: "label1", value: "value1" },
    { label: "label2", value: "value2" },
    ...
  ]
})
```

## Menu {#menu-class}

`new Menu(options)`

Class definition for a menu input that extends [`MosaicClient`](../core/client).
The constructor accepts the same options as the [`menu`](#menu-method) method.

### element

`menu.element`

The HTML element containing the menu input.
