---
title: Legends
---
<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';

  /** @type {import('vue').Ref<'js' | 'python'>} */
  const language = ref('js');

  function parseLang(search) {
    const q = new URLSearchParams(search || '').get('lang');
    if (q === 'python') return 'python';
    return 'js';
  }

  function applyLangToUrl(lang) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    const next = url.pathname + url.search + url.hash;
    const cur =
      window.location.pathname + window.location.search + window.location.hash;
    if (next !== cur) {
      history.replaceState(history.state, '', next);
    }
  }

  function setLanguage(lang) {
    language.value = lang;
    applyLangToUrl(lang);
  }

  function onPopState() {
    language.value = parseLang(window.location.search);
  }

  onMounted(() => {
    const search = window.location.search;
    language.value = parseLang(search);
    if (!new URLSearchParams(search).has('lang')) {
      applyLangToUrl(language.value);
    }
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
  });
</script>

<div class="vgplot-toggle" role="tablist" aria-label="Legends documentation language">
  <button
    role="tab"
    type="button"
    :aria-selected="language === 'js'"
    :class="{ active: language === 'js' }"
    @click="setLanguage('js')"
  >
    JS
  </button>
  <button
    role="tab"
    type="button"
    :aria-selected="language === 'python'"
    :class="{ active: language === 'python' }"
    @click="setLanguage('python')"
  >
    Python
  </button>
</div>

<template v-if="language === 'js'">

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

</template>

<template v-else>

# Legends

Legends visualize color and symbol scales to aid chart interpretation.
Legend directives from `mosaic.vgplot` compose into the plot spec like other directives.

::: warning
At present only discrete legends can be used as interactors.
We plan to add support for interval selections over continuous color ramps in the future.
:::

## color_legend

`vg.color_legend(...)`

Create a legend for the plot `color` scale (`vg.color_legend(**options)`). The following _options_ are supported:

- _for_: A string indicating the [name](./attributes) of the corresponding plot (when building a standalone legend element).
- _as_: A [Selection](../core/selection) updated by interactions with this legend.
- Additional options forwarded to Observable Plot legend options when the spec is rendered.

Inside `vg.plot(...)`, omit _for_ so the legend belongs to that plot.

## opacity_legend

`vg.opacity_legend(...)`

Create a legend for the plot `opacity` scale. Options match the JavaScript [`opacityLegend`](#opacitylegend) case (`_for_`, `_as_`, plus Observable Plot legend options).

## symbol_legend

`vg.symbol_legend(...)`

Create a legend for the plot `symbol` scale. Options match the JavaScript [`symbolLegend`](#symbollegend) case (`_for_`, `_as_`, plus Observable Plot legend options).

</template>
