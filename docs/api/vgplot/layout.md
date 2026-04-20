---
title: Layout
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

<div class="vgplot-toggle" role="tablist" aria-label="Layout documentation language">
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

<template v-else>

# Layout

Layout helpers for composing views when building Mosaic specs with `mosaic.vgplot`.

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
