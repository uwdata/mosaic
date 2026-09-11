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
