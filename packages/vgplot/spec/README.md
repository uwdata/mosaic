# mosaic-spec

[![npm version](https://img.shields.io/npm/v/@uwdata/mosaic-spec.svg)](https://www.npmjs.com/package/@uwdata/mosaic-spec)

Declarative specification of Mosaic-powered applications as JSON or YAML files. This package provides a parser and code generation framework for reading specifications in a JSON format and generating live Mosaic visualizations and dashboards using the [vgplot](https://github.com/uwdata/mosaic/tree/main/packages/vgplot/vgplot) API.

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

## Visual Tests

Visual tests use Playwright to render each JSON spec and compare screenshots against stored snapshots. Snapshots must be generated inside a Docker container that matches CI so they are pixel-identical across machines.

Run tests (compare against existing snapshots):

```sh
bin/visual-test.sh
```

Update snapshots:

```sh
bin/visual-test.sh --update
```

The script uses Docker by default. On macOS you can use the lightweight [Container](https://github.com/nicklockwood/Container) runtime instead:

```sh
brew install --cask container
container system start
CONTAINER_RUNTIME=container bin/visual-test.sh --update
container system stop
```

Alternatively, you can download updated snapshots from the `playwright-test-results` artifact uploaded by the `browser` CI job.
