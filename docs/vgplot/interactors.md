# Interactors

In addition to _marks_ and _attributes_, `plot` specifications may include _interactors_ to imbue plots with interactive behavior. Most interactors listen to input events from rendered plot SVG elements to update bound [Selections](selections). Interactors take facets into account to properly handle input events across subplots.

## toggle

The `toggle` interactor selects individual points (e.g., by click or shift-click) and generates a selection clause over specified fields of those points. Directives such as `toggleColor`, `toggleX`, and `toggleY` simplify specification of which channel fields are included in the resulting predicates.

## nearest

The `nearestX` and `nearestY` interactors select the nearest value along the `x` and/or `y` channel.

## interval

The `intervalX` and `intervalY` interactors create 1D interval brushes.
The `intervalXY` interactor creates a 2D brush.

Interval interactors accept a `pixelSize` parameter that sets the brush resolution: values may snap to a grid whose bins are larger than screen pixels and this can be leveraged to optimize query latency.

## panZoom

The `panZoom` interactor produces interval selections over corresponding `x` or `y` scale domains.

## highlight

The `highlight` interactor updates the rendered state of a visualization in response to a Selection.
Non-selected points are set to translucent, neutral gray, or other specified visual properties.
Selected points maintain normal encodings.
We perform highlighting by querying for a selection bit vector and then modifying the rendered SVG.
