# Plot {#plot-page}

A `Plot` is defined using a set of directives that specify [_attributes_](./attributes), graphical [_marks_](./marks), [_interactors_](./interactors), and [_legends_](./legends).

``` js
plot(
  width(500), // attribute
  rectY(from("table"), { x1: 'u', x2: 'v', y: 'w', fill: 'c' }), // mark
  intervalX({ as: selection }), // interactor
  colorLegend() // legend
)
```

## plot

`plot(...directives)`

Create a new `Plot` instance based on the provided _directives_ and return the corresponding HTML element.

## Plot {#plot-class}

`new Plot(element)`

Class definition for a `Plot`.
If provided, the input _element_ will be used as the container for the plot, otherwise a new `div` element will be generated.

### element

`plot.element`

The HTML element containing the plot.

### margins

`plot.margins()`

Return the specified margins of the plot as an object of the form `{left, right, top, bottom}`.

### innerWidth

`plot.innerWidth()`

Return the "inner" width of the plot, which is the `width` attribute value minus the `leftMargin` and `rightMargin` values.

### innerHeight

`plot.innerHeight()`

Return the "inner" height of the plot, which is the `height` attribute value minus the `topMargin` and `bottomMargin` values.

### pending

`plot.pending(mark)`

Called by a [`Mark`](./mark/) instance to inform this parent plot that the mark has a pending data update.

### update

`plot.update(mark)`

Called by a [`Mark`](./mark/) instance to inform this parent plot that the mark has completed an update.

### render

`plot.render()`

Renders this plot within its container element.

### getAttribute

`plot.getAttribute(name)`

Returns the attribute value for the given attribute _name_.
Called by [attribute directives](./attributes.md).

### setAttribute

`plot.setAttribute(name, value, options)`

Sets the attribute value for the given attribute _name_.
Returns `true` if the attribute is updated to a new value, `false` otherwise.
The _options_ hash may include a _silent_ flag to suppress listener updates.
Called by [attribute directives](./attributes.md).

### addAttributeListener

`plot.addAttributeListener(name, callback)`

Adds an event listener _callback_ that is invoked when the attribute with the given _name_ is updated.

### removeAttributeListener

`plot.removeAttributeListener(name, callback)`

Removes an event listener _callback_ associated with the given attribute _name_.

### addParams

`plot.addParams(mark, paramSet)`

Register a set of [Params](../core/param) associated with a _mark_ to coordinate updates.
Called by child [`Mark`](./mark/) instances.

### addMark

`plot.addMark(mark)`

Add a [`Mark`](./mark/) instance to this plot.
Called by [mark directives](./mark/).

### markSet

`plot.markSet`

Property getter that returns a [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) containing this plot's marks.

### addInteractor

`plot.addInteractor(interactor)`

Add an interactor to this plot.
Called by [interactor directives](./interactors).

### addLegend

`plot.addLegend(legend, include)`

Add a _legend_ associated with this plot.
The _include_ flag (default `true`) indicates if the legend should be included within the same container element as the plot.
Called by [legend directives](./legends).
