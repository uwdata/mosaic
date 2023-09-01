# Interactors

Interactors imbue plots with interactive behavior, such as selecting or highlighting values, and panning or zooming the display.

To determine which fields (database columns) an interactor should select, an interactor defaults to looking at the corresponding encoding channels for the most recently added mark.
Alternatively, interactors accept options that explicitly indicate which data fields should be selected.

## toggle

`toggle(options)`

Select individual data values by clicking / shift-clicking points. The supported _options_ are:

- _as_: The [Selection](../core/selection) to populate with filter predicates.
- _channels_: An array of encoding channels (e.g., `"x"`, `"y"`, `"color"`) indicating the data values to select.
- _peers_: A Boolean-flag (default `true`) indicating if all marks in the current plot should be considered "peers" in the clients set used to perform cross-filtering. A peer mark will be exempt from filtering. Set this to false if you are using a cross-filtered selection but want to filter across marks within the same plot.

### toggleX

`toggleX(options)`

A shorthand for a [`toggle`](#toggle) interactor over the `"x"` encoding channel only.

### toggleY

`toggleY(options)`

A shorthand for a [`toggle`](#toggle) interactor over the `"y"` encoding channel only.


### toggleColor

`toggleColor(options)`

A shorthand for a [`toggle`](#toggle) interactor over the `"color"` encoding channel only.

## nearest

Select the nearest value to the current cursor position.

### nearestX

`nearestX(options)`

Select the nearest value along the x dimension. The supported _options_ are:

- _as_: The [Selection](../core/selection) to populate with filter predicates.
- _field_: The field to select. If not specified, the field backing the `"x"` encoding channel of the most recently added mark is used.

### nearestY

`nearestY(options)`

Select the nearest value along the y dimension. The supported _options_ are:

- _as_: The [Selection](../core/selection) to populate with filter predicates.
- _field_: The field to select. If not specified, the field backing the `"x"` encoding channel of the most recently added mark is used.

## interval

Select all values within an interval range.

### intervalX

`intervalX(options)`

Select a 1D interval range along the x dimension. The supported _options_ are:

- _as_: The [Selection](../core/selection) to populate with filter predicates.
- _field_: The field to select. If not specified, the field backing the `"x"` encoding channel of the most recently added mark is used.
- _pixelSize_: The size of an interactive "pixel" (default 1). If set larger, the interval brush will "snap" to a grid larger than visible pixels. In some cases this can be helpful to improve scalability to large data by reducing interactive resolution.
- _peers_: A Boolean-flag (default `true`) indicating if all marks in the current plot should be considered "peers" in the clients set used to perform cross-filtering. A peer mark will be exempt from filtering. Set this to false if you are using a cross-filtered selection but want to filter across marks within the same plot.
- _brush_: An optional object that provides CSS styles for the visible brush.

### intervalY

`intervalY(options)`

Select a 1D interval range along the y dimension. The supported _options_ are:

- _as_: The [Selection](../core/selection) to populate with filter predicates.
- _field_: The field to select. If not specified, the field backing the `"y"` encoding channel of the most recently added mark is used.
- _pixelSize_: The size of an interactive "pixel" (default 1). If set larger, the interval brush will "snap" to a grid larger than visible pixels. In some cases this can be helpful to improve scalability to large data by reducing interactive resolution.
- _peers_: A Boolean-flag (default `true`) indicating if all marks in the current plot should be considered "peers" in the clients set used to perform cross-filtering. A peer mark will be exempt from filtering. Set this to false if you are using a cross-filtered selection but want to filter across marks within the same plot.
- _brush_: An optional object that provides CSS styles for the visible brush.

### intervalXY

`intervalXY(options)`

Select a 2D interval range along the x and y dimensions. The supported _options_ are:

- _as_: The [Selection](../core/selection) to populate with filter predicates.
- _xfield_: The x field to select. If not specified, the field backing the `"x"` encoding channel of the most recently added mark is used.
- _yfield_: The y field to select. If not specified, the field backing the `"y"` encoding channel of the most recently added mark is used.
- _pixelSize_: The size of an interactive "pixel" (default 1). If set larger, the interval brush will "snap" to a grid larger than visible pixels. In some cases this can be helpful to improve scalability to large data by reducing interactive resolution.
- _peers_: A Boolean-flag (default `true`) indicating if all marks in the current plot should be considered "peers" in the clients set used to perform cross-filtering. A peer mark will be exempt from filtering. Set this to false if you are using a cross-filtered selection but want to filter across marks within the same plot.
- _brush_: An optional object that provides CSS styles for the visible brush.

## pan & zoom

Pan or zoom a plot.
To pan, click and drag within a plot.
To zoom, scroll within in a plot.

Panning and zooming is implemented by changing the `x` and/or `y` scale domains and re-rendering the plot in response.

Pan/zoom interactors will automatically update the plot `xDomain` and `yDomain` attributes.
For linked panning and zooming across plot, first define your own selections and pass them as options.
You can additionally use such selections to have the pan/zoom state filter other marks.

All pan/zoom directives share the same possible _options_:

- _x_: The [Selection](../core/selection) over the `x` encoding channel domain. If unspecified, a new selection instance is used.
- _y_: The [Selection](../core/selection) over the `y` encoding channel domain. If unspecified, a new selection instance is used.
- _xfield_: The x field to select. If not specified, the field backing the `"x"` encoding channel of the most recently added mark is used.
- _yfield_: The y field to select. If not specified, the field backing the `"y"` encoding channel of the most recently added mark is used.

### pan

`pan(options)`

Pan the plot in either the `x` or `y` dimension.
Do not perform zooming.
The supported _options_ are listed above.

### panX

`panX(options)`

Pan the plot in the `x` dimension only.
Do not perform zooming.
The supported _options_ are listed above.

### panY

`panY(options)`

Pan the plot in the `y` dimension only.
Do not perform zooming.
The supported _options_ are listed above.

### panZoom

`panZoom(options)`

Pan or zoom the plot in either the `x` or `y` dimension.
The supported _options_ are listed above.

### panZoomX

`panZoomX(options)`

Pan or zoom the plot in the `x` dimension only.
The supported _options_ are listed above.

### panZoomY

`panZoomY(options)`

Pan or zoom the plot in the `y` dimension only.
The supported _options_ are listed above.


## highlight

`highlight(options)`

Highlight individual visualized data points based on a [Selection](../core/selection).
Selected values keep their normal appearance.
Unselected values are deemphasized.

- _by_: The [Selection](../core/selection) driving the highlighting.
- _channels_: An optional object of channel/value mappings that defines what CSS styles to apply to deemphasized items. The default value is to set the `opacity` channel to `0.2`.
