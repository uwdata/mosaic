# Menu

A dropdown menu input widget.

## menu {#menu-method}

`menu(options)`

Return a new menu component with the provided _options_.
Creates an instance of the [`Menu`](#menu-class) class, connects it to [`coordinator`](../core/coordinator), and returns the corresponding HTML element.

The supported options are:

- _as_: A `Param` or `Selection` that this menu should update. For a `Param`, the selected menu value is set to be the new param value. For a `Selection`, a predicate of the form `column = value` will be added to the selection.
- _filterBy_: An optional selection by which to filter the content of the menu, if drawn from a backing table.
- _from_: The name of the backing database table or view.
- _column_: The backing database column this menu represents. If specified, the distinct column values will be queried to populate the menu.
- _label_: A text label for the menu input. If unspecified, the _column_ name (if provided) will be used by default.
- _format_: An optional format function to transform values to strings for inclusion in the menu.
- _options_: An explicit array of options to include in the menu. This option can be used instead of pulling values from a backing database table. Each option entry should consist of an object with `label` and `value` properties.
- _value_: The initial value of the menu.
- _element_: The container DOM element. If unspecified, a new `div` is created.

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
