---
title: Layout
---
<script setup>
  import { useLang } from '../../.vitepress/theme/useLang.js';
  const { language, setLanguage } = useLang();
</script>

<LangToggle :model-value="language" aria-label="Layout documentation language" @update:model-value="setLanguage" />

<template v-if="language === 'js'">

# Layout

Layout helpers for creating dashboard displays.

## vconcat

`vconcat(...elements)`

Vertically concatenate a collection of Web elements.
Places elements in a column.

## hconcat

`hconcat(...elements)`

Horizontally concatenate a collection of Web elements.
Places elements in a row.

## zconcat

`zconcat(...elements)`

Layer a collection of Web elements on top of one another, in the same space.
Elements are drawn in order, so later elements appear over earlier ones.
The layout is as large as its largest element, and smaller elements are aligned to its top-left corner.

Plots have a transparent background, so the elements below show through.
To overlay plots that share a coordinate system, give them the same size and margins, and turn off the axes of the upper plots (for example with the `axis` attribute).
Note that only the topmost element receives pointer events, so interactors and tooltips on lower elements will not respond.

## vspace

`vspace(size)`

Add vertical space between elements.
If _size_ is a number it is interpreted as a pixel value, otherwise it will be interpreted as a [CSS dimension](https://developer.mozilla.org/en-US/docs/Web/CSS/dimension).

## hspace

`hspace(size)`

Add horizontal space between elements.
If _size_ is a number it is interpreted as a pixel value, otherwise it will be interpreted as a [CSS dimension](https://developer.mozilla.org/en-US/docs/Web/CSS/dimension).

</template>

<template v-else-if="language === 'python'">

# Layout

Layout helpers for creating dashboard displays.

## vconcat

`vg.vconcat(...elements)`

Vertically concatenate elements in a column (same helpers as in JavaScript).

## hconcat

`vg.hconcat(...elements)`

Horizontally concatenate elements in a row.

## zconcat

`vg.zconcat(...elements)`

Layer elements on top of one another, in order: later elements are drawn over earlier ones.
See the JavaScript `zconcat` documentation for details.

## vspace

`vg.vspace(size)`

Add vertical space between elements.
If _size_ is a number it is interpreted as a pixel value, otherwise it will be interpreted as a [CSS dimension](https://developer.mozilla.org/en-US/docs/Web/CSS/dimension).

## hspace

`vg.hspace(size)`

Add horizontal space between elements.
If _size_ is a number it is interpreted as a pixel value, otherwise it will be interpreted as a [CSS dimension](https://developer.mozilla.org/en-US/docs/Web/CSS/dimension).

</template>

<LangError v-else :language="language" />
