# mosaic-spec

[![npm version](https://img.shields.io/npm/v/@uwdata/mosaic-spec.svg)](https://www.npmjs.com/package/@uwdata/mosaic-spec)

Declarative specification of Mosaic-powered applications as JSON or YAML files. This package provides a parser and code generation framework for reading specifications in a JSON format and generating live Mosaic visualizations and dashboards using the [vgplot](https://github.com/uwdata/mosaic/tree/main/packages/vgplot) API.

## Usage

To parse a specification and generate round-trip JSON output (`.toJSON()`), JavaScript module code (`astToESM`), or a live web application (`astToDOM`):

```js
import { parseSpec, astToDOM, astToESM } from '@uwdata/mosaic-spec';

// declarative specification in JSON format
const spec = {
  plot: [
    {
      mark: 'lineY',
      data: { from: 'table' },
      x: 'date',
      y: 'value'
    }
  ],
  width: 640,
  height: 200
};

// parse specification to internal AST (abstract syntax tree)
const ast = parseSpec(spec);

// serialize back to a normalized JSON format
const json = ast.toJSON();

// generate ESM (ECMAScript Module) code
const code = astToESM(ast);

// instantiate a running application
// assumes standard browser facilities in globabl variable `window`
const {
  element, // root DOM element of the application
  params   // Map of all named Params and Selections
} = await astToDOM(ast);

// add application to current web page
document.body.appendChild(element);
```

To parse specifications in YAML format, import the `yaml` library and use it to parse input specification files:

```js
import { parseSpec } from '@uwdata/mosaic-spec';
import { parse } from 'yaml';

const yaml = /* load yaml file file */;
const spec = parse(yaml); // parse yaml to JS objects

// parse specification to internal AST (abstract syntax tree)
const ast = parseSpec(spec);
```
