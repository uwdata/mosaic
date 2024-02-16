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
