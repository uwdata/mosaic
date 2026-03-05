<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Mosaic Declarative Specifications

The `mosaic-spec` package enables declarative specification of Mosaic applications as JSON or YAML files. The package provides a specification parser, as well as generators to create either running applications or JavaScript code.

For example, below is an example of a declarative specification, in either YAML or equivalent JSON, for a simple line chart. The JavaScript tab shows the code generated from the parsed specification.

<Example spec="/specs/yaml/line.yaml" />

::: code-group
<<< @/public/specs/yaml/line.yaml [YAML]
<<< @/public/specs/json/line.json [JSON]
<<< @/public/specs/esm/line.js [JavaScript]
:::

Using a declarative specification, we can describe an application in a standard file format, enabling portability across platforms. For example, the [Mosaic Jupyter widget](/jupyter/) uses this format to pass visualization and dashboard definitions from Python to the browser.

::: tip
The [TypeScript types in the `@uwdata/mosaic-spec` package](https://github.com/uwdata/mosaic/tree/main/packages/vgplot/spec/src/spec) provide comprehensive documentation of Mosaic declarative specifications.
:::

## Specification Format

Here is a slightly more complicated example, in which a dynamic `Param` value is added to the data before visualizing it.

<Example spec="/specs/yaml/bias.yaml" />

::: code-group
<<< @/public/specs/yaml/bias.yaml [YAML]
<<< @/public/specs/json/bias.json [JSON]
<<< @/public/specs/esm/bias.js [JavaScript]
:::

The example above includes descriptive metadata, `data` and `params` definitions, and nested components: an input `slider` and `plot` are positioned using a `vconcat` layout. The `plot` uses a SQL expression that includes a `Param` reference (`$point`) to define a dynamic `y` encoding channel.

A declarative specification may include top-level definitions for:

- `meta`: Metadata such as a title and description.
- `config`: Configuration settings, such as database extensions to load.
- `data`: Dataset definitions, such as files, queries, or inline data.
- `params`: Param & Selection definitions. All later Param references use a `$` prefix.
- `plotDefaults`: Default plot attributes to apply to all plot instances.

The rest of the spec consists of component definitions supported by the [`vgplot`](/vgplot/) API, including plots, inputs, and layout components.

For more, see the [Specification Format Reference](/api/spec/format).

## Parser & Generators Format

The `parseSpec()` method parses a specification in JSON format into an _abstract syntax tree_ (AST): a structured representation of the specification content that is more convenient to analyze and manipulate.

Given a parsed AST, the generator method `astToDOM()` instantiates a running web application, returning Mosaic-backed Document Object Model (DOM) elements that can be added to a web page.

Meanwhile, the `astToESM()` method instead generates JavaScript code, in the form of an ECMAScript Module (ESM), that uses the `vgplot` API. The code listed in the examples above was generated using this method.

For more, see the [Specification Parser & Generators Reference](/api/spec/parser-generators).
