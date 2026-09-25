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

`zconcat(...elements)`<br>
`zconcat({ halign, valign }, ...elements)`

Layer a collection of Web elements on top of one another, in the same space.
Elements are drawn in order, so later elements appear over earlier ones.
The layout is as large as its largest element.

Elements smaller than the layout are positioned by the optional _halign_ and _valign_ options, which can be passed as a leading object.
Each is a number in [0, 1], like the _align_ option of ordinal scales:

- _halign_: 0 (default) aligns to the left, 0.5 centers horizontally, 1 aligns to the right.
- _valign_: 0 (default) aligns to the top, 0.5 centers vertically, 1 aligns to the bottom.

For example, `zconcat({ halign: 0.5, valign: 0.5 }, big, small)` centers a smaller plot over a larger one.

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

`vg.zconcat(*elements, halign=None, valign=None)`

Layer elements on top of one another, in order: later elements are drawn over earlier ones.
The optional _halign_ and _valign_ (numbers in [0, 1]) position elements smaller than the layout: 0 aligns to the left or top, 0.5 centers, and 1 aligns to the right or bottom.
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
