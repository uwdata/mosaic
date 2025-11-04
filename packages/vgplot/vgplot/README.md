# vgplot: A Mosaic-powered Visualization Grammar

[![npm version](https://img.shields.io/npm/v/@uwdata/vgplot.svg)](https://www.npmjs.com/package/@uwdata/vgplot)

A **v**isualization **g**rammar for interactive Mosaic-powered visualizations and dashboards. This package provides convenient, composable methods that combines multiple Mosaic packages (core, inputs, plot, etc.) in an integrated API.

vgplot is a JavaScript API for creating visualizations and dashboards. See the [mosaic-spec](https://github.com/uwdata/mosaic/tree/main/packages/vgplot/spec) package to instead use declarative specifications in JSON or YAML format.

## Using vgplot in No-Build Projects

For projects that don't use a build system, vgplot provides a UMD bundle that can be included directly in HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@uwdata/vgplot/dist/umd/vgplot.umd.js"></script>
<script>
  // vgplot is now available as a global variable
  const coordinator = vgplot.coordinator();
  // ... use other vgplot APIs
</script>
```

Alternatively, you can use unpkg:

```html
<script src="https://unpkg.com/@uwdata/vgplot/dist/umd/vgplot.umd.js"></script>
```
