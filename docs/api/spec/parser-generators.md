# Specification Parser & Generators

Methods to parse declarative specifications and generate applications or code as output.

## parseSpec

`parseSpec(specification)`

Parse a JSON _specification_ and return the resulting abstract syntax tree (AST).
The input _specification_ can either be a JSON-formatted string or a JavaScript object.

To instead use a YAML specification, parse the YAML text first:

``` js
import { parseSpec } from "@uwdata/mosaic-spec";
import yaml from "yaml";
const spec = yaml.parse(yamlText);
parseSpec(spec);
```

The resulting AST node is an object with the following properties and methods:

- _meta_: An object of specification metadata, corresponding to the input spec's top-level `meta` property.
- _config_: An object for top-level configuration options, such as database extenstions to load.
- _root_: The root node for the rest of the AST. This might represent a `plot`, `hconcat`, `vconcat`, or other top-level specification element.
- _data_: Dataset definitions as an array of key-value pairs. The keys are dataset names and the values are AST nodes for the dataset definition.
- _params_: Param and Selection definitions as an array of key-value pairs. The keys are params names and the values are AST nodes for Param or Selection definitions.
- _plotDefaults_: An array of plot attribute AST nodes, representing default attributes to apply to all plot instances.
- _toJSON_: A method that returns the specification in JSON format. The result will be compatible with the original parsed input, but may not match it exactly. For example, implicitly defined selections will now have explicit top-level definitions.

### Example

```js
import { parseSpec } from "@uwdata/mosaic-spec";

// declarative specification in JSON format
const spec = {
  plot: [
    {
      mark: "lineY",
      data: { from: "table" },
      x: "date",
      y: "value"
    }
  ],
  width: 640,
  height: 200
};

// parse specification to internal AST (abstract syntax tree)
const ast = parseSpec(spec);

// serialize back to a normalized JSON format
const json = ast.toJSON();
```


## astToDOM

`astToDOM(ast, options)`

Given a parsed specification AST, load data, generate Params/Selections, and instantiate corresponding web Document Object Model (DOM) elements. This is an `async` method and so returns a `Promise`.

The supported _options_ are:

- _api_: A [vgplot API context](../vgplot/context) to use. By default, a new API context is created that uses the global `Coordinator` and a new, empty `namedPlots` map.
- _activeParams_: A `Map` from parameter names to live Param or Selection instances. The default is an empty map. A pre-populated map can be provided to reuse params across specifications.
- _baseURL_: The base URL (default `null`) from which to load data files.

The fulfilled value of the returned Promise is an object with the following properties:

- _element_: The DOM element containing the initialized application.
- _params_: A `Map` of parameter names to Param/Selection instances.

### Example

```js
import { astToDOM } from "@uwdata/mosaic-spec";

// instantiate a running application
// assumes standard browser facilities in globabl variable `window`
const {
  element, // root DOM element of the application
  params   // Map of all named Params and Selections
} = await astToDOM(ast);

// add application to current web page
document.body.appendChild(element);
```


## astToESM

`astToESM(ast, options)`

Given a parsed specification AST, generate corresponding JavaScript module (ESM) code that uses the `vgplot` API.

The supported _options_ are:

- _baseURL_: The base URL (default `null`) from which to load data files.
- _namespace_: The namespace to use for vgplot API methods (default `'vg'`)`.
- _connector_: The database connector to use, one of `null` (default, for no explicit connector code), `rest`, `socket`, or `wasm`.
- _depth_: The starting text indentation depth (default `0`).
- _imports_: A `Map` indicating external ESM packages to load. Each key is the name of the package to load, and each value is either a string or string array indicating what to import from that package. The default is `new Map([["@uwdata/vgplot", "* as vg"]])`.

The return value is a string of generated ESM code.

### Example

```js
import { astToESM } from "@uwdata/mosaic-spec";

// generate ESM (ECMAScript Module) code
const code = astToESM(ast);
```
