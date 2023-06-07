# Legends

Legends visualize color and symbol scales to aid chart interpretation.
Legends can also serve as [interactors](./interactors) that filter or highlight plot content.

::: warning
At present only discrete legends can be used as interactors.
We plan to add support for interval selections over continuous color ramps in the future.
:::


## colorLegend

`colorLegend(options)`

Create a new legend for a plot's `color` scale. The following _options_ are supported:

- _for_: A string indicating the [name](./attributes) of the corresponding plot.
- _as_: A [Selection](../core/selection) updated by interactions with this legend.
- Additional options that will be passed to the [Observable Plot legend method](https://observablehq.com/plot/features/legends#legend-options).

If invoked as a directive within a plot definition, the _for_ option should not be used, and the legend will be included as part of the plot itself.

If invoked with the _for_ option in a standalone fashion, returns a Web element containing the legend only.

## opacityLegend

`opacityLegend(options)`

Create a new legend for a plot's `opacity` scale. The following _options_ are supported:

- _for_: A string indicating the [name](./attributes) of the corresponding plot.
- _as_: A [Selection](../core/selection) updated by interactions with this legend.
- Additional options that will be passed to the [Observable Plot legend method](https://observablehq.com/plot/features/legends#legend-options).

If invoked as a directive within a plot definition, the _for_ option should not be used, and the legend will be included as part of the plot itself.

If invoked with the _for_ option in a standalone fashion, returns a Web element containing the legend only.

## symbolLegend

`symbolLegend(options)`

Create a new legend for a plot's `symbol` scale. The following _options_ are supported:

- _for_: A string indicating the [name](./attributes) of the corresponding plot.
- _as_: A [Selection](../core/selection) updated by interactions with this legend.
- Additional options that will be passed to the [Observable Plot legend method](https://observablehq.com/plot/features/legends#legend-options).

If invoked as a directive within a plot definition, the _for_ option should not be used, and the legend will be included as part of the plot itself.

If invoked with the _for_ option in a standalone fashion, returns a Web element containing the legend only.
