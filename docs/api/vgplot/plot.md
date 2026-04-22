---
title: Plot
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

<div class="vgplot-toggle" role="tablist" aria-label="Plot documentation language">
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

# Plot {#plot-page}

A `Plot` is defined using a set of directives that specify [_attributes_](./attributes), graphical [_marks_](./marks), [_interactors_](./interactors), and [_legends_](./legends).

<template v-if="language === 'js'">

``` js
plot(
  width(500), // attribute
  rectY(from("table"), { x1: "u", x2: "v", y: "w", fill: "c" }), // mark
  intervalX({ as: selection }), // interactor
  colorLegend() // legend
)
```

</template>

<template v-else>

``` python
import mosaic.vgplot as vg

vg.plot(
    vg.width(500),  # attribute
    vg.rect_y(data=vg.from_("table"), x1="u", x2="v", y="w", fill="c"),  # mark
    vg.interval_x(as_=selection),  # interactor
    vg.color_legend(),  # legend
)
```

</template>

## plot

<template v-if="language === 'js'">

`plot(...directives)`

Create a new `Plot` instance based on the provided _directives_ and return the corresponding HTML element.

</template>

<template v-else>

`vg.plot(...directives)`

Build a plot specification from the provided _directives_ for use with Mosaic widgets or other consumers.

</template>

## Plot {#plot-class}

<template v-if="language === 'js'">

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

Called by a [`Mark`](./marks) instance to inform this parent plot that the mark has a pending data update.

### update

`plot.update(mark)`

Called by a [`Mark`](./marks) instance to inform this parent plot that the mark has completed an update.

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
Called by child [`Mark`](./marks) instances.

### addMark

`plot.addMark(mark)`

Add a [`Mark`](./marks) instance to this plot.
Called by [mark directives](./marks).

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
</template>

<template v-else>

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

`plot.inner_width()`

Return the "inner" width of the plot, which is the `width` attribute value minus the `left_margin` and `right_margin` values.

### innerHeight

`plot.inner_height()`

Return the "inner" height of the plot, which is the `height` attribute value minus the `top_margin` and `bottom_margin` values.

### pending

`plot.pending(mark)`

Called by a [`Mark`](./marks) instance to inform this parent plot that the mark has a pending data update.

### update

`plot.update(mark)`

Called by a [`Mark`](./marks) instance to inform this parent plot that the mark has completed an update.

### render

`plot.render()`

Renders this plot within its container element.

### getAttribute

`plot.get_attribute(name)`

Returns the attribute value for the given attribute _name_.
Called by [attribute directives](./attributes.md).

### setAttribute

`plot.set_attribute(name, value, options)`

Sets the attribute value for the given attribute _name_.
Returns `true` if the attribute is updated to a new value, `false` otherwise.
The _options_ hash may include a _silent_ flag to suppress listener updates.
Called by [attribute directives](./attributes.md).

### addAttributeListener

`plot.add_attribute_listener(name, callback)`

Adds an event listener _callback_ that is invoked when the attribute with the given _name_ is updated.

### removeAttributeListener

`plot.remove_attribute_listener(name, callback)`

Removes an event listener _callback_ associated with the given attribute _name_.

### addParams

`plot.add_params(mark, param_set)`

Register a set of [Params](../core/param) associated with a _mark_ to coordinate updates.
Called by child [`Mark`](./marks) instances.

### addMark

`plot.add_mark(mark)`

Add a [`Mark`](./marks) instance to this plot.
Called by [mark directives](./marks).

### markSet

`plot.mark_set`

Property getter that returns a [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) containing this plot's marks.

### addInteractor

`plot.add_interactor(interactor)`

Add an interactor to this plot.
Called by [interactor directives](./interactors).

### addLegend

`plot.add_legend(legend, include)`

Add a _legend_ associated with this plot.
The _include_ flag (default `true`) indicates if the legend should be included within the same container element as the plot.
Called by [legend directives](./legends).
</template>
