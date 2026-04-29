---
title: API Context
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

<div class="vgplot-toggle" role="tablist" aria-label="API Context documentation language">
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

# API Context

All `vgplot` methods are invoked within a surrounding _context_ of evaluation. A context consists of all API methods, a [coordinator](../core/coordinator), a map of [named plots](#namedplots).

A default context is used when exported methods are called directly. This default context uses the global coordinator (returned by `vg.coordinator()`) and a shared `namedPlots` map (`vg.namedPlots`).

A dedicated context can be created using [`createAPIContext()`](#createapicontext) to:

- use an alternative coordinator to run separate Mosaic instances on the same page,
- use a separate namedPlot maps to avoid plot name collisions across specs,
- or extend the vgplot API with additional components and methods.

## namedPlots

`namedPlots`

A map from plot names to plot instances. This map gets populated with a (name, plot) pair when a plot includes the `name` attribute. Stand-alone legend components use this map to lookup needed scale information for a plot.

A default global map is exported from the `vgplot` module and used as part of the default context. An isolated `namedPlots` instance can be created as part of a new API context.

## createAPIContext

`createAPIContext(options)`

Create a new API context that exposes `vgplot` methods. The following options are supported:

- _coordinator_: The Mosaic [coordinator](../core/coordinator) to use. By default, the global coordinator (`vg.coordinator()`) is used. A new coordinator instance can be provided to use a separate database connector and isolated params.
- _namedPlots_: The named plot map to use. By default a new, empty named plot map is created. The `vg.namedPlots` instance can be provided to reuse the global default map.
- _extensions_: API extensions to include in the created context. All methods and properties of the extension object will be copied to returned context object, potentially overwriting existing methods.
- _...options_: Any other provided options will be included as properties of the `context` property of the generated API context object. This can be used to pass configuration values to extension methods.

The resulting API context object exposes the vgplot API methods, along with any properties copied from the _extensions_ option. The API context object also includes a `context` property, which references an object with `coordinator` and `namedPlots` properties along with any additional options to `createAPIContext`.

### Example

```js
import {
  Coordinator, createAPIContext, socketConnector
} from "uwdata/vgplot";

// create a new API context, using a coordinator with
// a dedicated socket connector to a DuckDB server
const api = createAPIContext({
  coordinator: new Coordinator(socketConnector("ws://localhost:8001/"))
});

// use the API context just like normal vgplot exports
document.appendChild(
  api.vconcat(
    api.plot(...),
    ...
  )
);
```

</template>

<template v-else>

# API Context

The [`createAPIContext`](#createapicontext) pattern below is for **embedding Mosaic in the browser** with the JavaScript `vgplot` package. In **Python**, you usually build a declarative view with [`mosaic.vgplot`](https://pypi.org/project/vgplot/), combine [`data`](https://pypi.org/project/vgplot/) sources, and pass the result to [`vg.spec`](https://pypi.org/project/vgplot/) for [`mosaic-widget`](https://pypi.org/project/mosaic-widget/) or export—rather than calling `createAPIContext` in the page runtime.

Coordinators, connectors, and named plot maps are still part of how Mosaic executes a spec in the widget or browser; the Python layer focuses on authoring that spec.

## Named plots

When a plot sets the [`name`](./attributes) attribute, that name registers the plot for legend lookup and linking—the same idea as the JavaScript `namedPlots` map, expressed in the serialized specification.

## createAPIContext

In JavaScript, `createAPIContext(options)` returns an object whose methods mirror top-level `vgplot` exports but bound to a chosen coordinator and named-plot registry. Switch to **JS** above for full option documentation.

### Example (Python)

```python
import mosaic.vgplot as vg

data = vg.data(d=vg.parquet("data.parquet"))
view = vg.vconcat(
    vg.plot(
        vg.dot(data=vg.from_("d"), x="a", y="b", r=2),
        vg.width(400),
        vg.height(240),
    ),
)
spec = vg.spec(data=data, view=view)
# Pass spec.to_dict() to mosaic-widget or export JSON/YAML.
```

Adjust `data` and marks to match your pipeline; the important piece is composing `view` with `vg.plot` / layout helpers and wrapping with `vg.spec`.

</template>
