# mosaic-spec

Declarative specification of Mosaic-powered applications. This package provides a parser and code generation framework for reading specifications in a JSON format and generating live Mosaic visualizations and dashboards using the [vgplot](https://github.com/uwdata/mosaic/tree/main/packages/vgplot) API.

## Usage

```js
import { parseSpec, astToDOM, astToModule } from '@uwdata/mosaic-spec';

// declarative specification in JSON format
const spec = {
  plot: [
    {
      mark: 'line',
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

// generate ESM (ECMAScript Modiule) code
const code = astToModule(ast);

// instantiate a running application
// assumes standard browser facilities in globabl variable `window`
const {
  element, // root DOM element of the application
  params   // Map of all named Params and Selections
} = await astToDOM(ast);

// add application to current web page
document.body.appendChild(element);
```
