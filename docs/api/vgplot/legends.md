---
title: Legends
---
<script setup>
  import { useLang } from '../../.vitepress/theme/useLang.js';
  const { language, setLanguage } = useLang();
</script>

<LangToggle :model-value="language" aria-label="Legends documentation language" @update:model-value="setLanguage" />

<template v-if="language === 'js'">

# Legends

Legends visualize color and symbol scales to aid chart interpretation.
Legends can also serve as [interactors](./interactors) that filter or highlight plot content.

<div v-if="language === 'js'">

::: warning
At present only discrete legends can be used as interactors.
We plan to add support for interval selections over continuous color ramps in the future.
:::

</div>

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

</template>

<template v-else-if="language === 'python'">

# Legends

Legends visualize color and symbol scales to aid chart interpretation.
Legends can also serve as [interactors](./interactors) that filter or highlight plot content.

<div v-if="language === 'python'">

::: warning
At present only discrete legends can be used as interactors.
We plan to add support for interval selections over continuous color ramps in the future.
:::

</div>

## color_legend

`vg.color_legend(...)`

Create a new legend for a plot's `color` scale. The following _options_ are supported:

- _plot_: A string indicating the [name](./attributes) of the corresponding plot (also accepted as `for_`).
- _bind_: A [Selection](../core/selection) updated by interactions with this legend.
- Additional options that will be passed to the [Observable Plot legend method](https://observablehq.com/plot/features/legends#legend-options).

If invoked as a directive within a `vg.plot(...)` definition, the _plot_ option should not be used, and the legend will be included as part of the plot itself.
If invoked with the _plot_ option in a standalone fashion, returns a standalone legend.

## opacity_legend

`vg.opacity_legend(...)`

Create a new legend for a plot's `opacity` scale. The following _options_ are supported:

- _plot_: A string indicating the [name](./attributes) of the corresponding plot (also accepted as `for_`).
- _bind_: A [Selection](../core/selection) updated by interactions with this legend.
- Additional options that will be passed to the [Observable Plot legend method](https://observablehq.com/plot/features/legends#legend-options).

If invoked as a directive within a `vg.plot(...)` definition, the _plot_ option should not be used, and the legend will be included as part of the plot itself.
If invoked with the _plot_ option in a standalone fashion, returns a standalone legend.

## symbol_legend

`vg.symbol_legend(...)`

Create a new legend for a plot's `symbol` scale. The following _options_ are supported:

- _plot_: A string indicating the [name](./attributes) of the corresponding plot (also accepted as `for_`).
- _bind_: A [Selection](../core/selection) updated by interactions with this legend.
- Additional options that will be passed to the [Observable Plot legend method](https://observablehq.com/plot/features/legends#legend-options).

If invoked as a directive within a `vg.plot(...)` definition, the _plot_ option should not be used, and the legend will be included as part of the plot itself.
If invoked with the _plot_ option in a standalone fashion, returns a standalone legend.

</template>

<LangError v-else :language="language" />
