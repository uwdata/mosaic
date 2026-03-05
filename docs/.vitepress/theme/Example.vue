<script>
import { withBase } from 'vitepress';
import yaml from 'yaml';
import { astToDOM, parseSpec } from '@uwdata/mosaic-spec';
import { coordinator, createAPIContext, loadParquet, wasmConnector } from '@uwdata/vgplot';

let ready;

function init() {
  if (!ready) {
    coordinator().logger(null);
    coordinator().databaseConnector(wasmConnector());
    ready = true;
  }
  return ready;
}

/**
 * Replacement method to sidestep HTTP range errors that arise when
 * loading (Geo/TopoJSON) text files from GitHub pages in Firefox.
 * Assumes the corresponding parquet files exist!
 */
function loadSpatial(table, file, options) {
  const { layer, ...opt } = options;
  const dot = file.lastIndexOf('.');
  const redirect = `${file.slice(0, dot)}${ layer ? '-' + layer : '' }.parquet`;
  opt.select = ['* EXCLUDE geom', 'ST_GeomFromWKB(geom) AS geom'];
  return 'INSTALL spatial; LOAD spatial; ' + loadParquet(table, redirect, opt);
}

export default {
  async mounted() {
    try {
      init();
      const api = createAPIContext({ extensions: { loadSpatial } });
      // we use cloudflare hosting of datasets to avoid GitHub pages limitations
      // in particular, Firefox range requests on GitHub pages leads to errors
      // to instead load data from the same domain as the docs, use this:
      //   location.origin + import.meta.env.BASE_URL;
      const baseURL = 'https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/';
      const text = await fetch(withBase(this.spec)).then(r => r.text());
      const spec = yaml.parse(text);
      const view = await astToDOM(parseSpec(spec), { api, baseURL });
      this.$refs.view.replaceChildren(view.element);
    } catch (err) {
      console.error(err);
      if (this.$refs?.view) {
        this.$refs.view.innerHTML = '<em>Example failed to load.</em> 😭';
      }
    }
  },
  props: {
    spec: String
  }
}
</script>

<style>
.mosaic-example {
  margin-top: 1.5em;
  margin-bottom: 1em;
}

.mosaic-example .plot,
.mosaic-example .legend,
.mosaic-example .legend svg {
  background: none !important;
  line-height: initial;
  user-select: none;
}

.mosaic-example .plot-d6a7b5 {
  background: none !important;
}

.mosaic-example .plot [aria-label="tip"] {
  --plot-background: var(--vp-c-bg-alt);
}

.mosaic-example .input {
  margin-right: 1em;
}

.mosaic-example .input > * {
  vertical-align: middle;
}

.mosaic-example .input label:first-of-type {
  margin-right: 0.5em;
}

.mosaic-example .input label.value {
  display: inline-block;
  margin-left: 0.5em;
  min-width: 40px;
}

.mosaic-example select {
  -webkit-appearance: auto;
  appearance: auto;
}

.mosaic-example button,
.mosaic-example input,
.mosaic-example optgroup,
.mosaic-example select,
.mosaic-example textarea {
  padding: revert;
  border: revert;
}

.mosaic-example input[type=text] {
  border: 1px solid #aaa;
  border-radius: 4px;
  padding-left: 4px;
}

.mosaic-example table {
  display: table;
  position: relative;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
  max-width: initial;
  min-height: 33px;
  margin: 0;
  width: 100%;
  font-size: 13px;
  line-height: 15.6px;
}

.mosaic-example thead tr th {
  position: sticky;
  top: 0;
  background: #fff;
  cursor: ns-resize;
  border-bottom: solid 1px #ccc;
}

.dark .mosaic-example thead tr th {
  background: rgb(30, 30, 32);
  border-bottom: solid 1px #444;
}

.mosaic-example tbody tr:hover {
  background: #eef;
}

.dark .mosaic-example tbody tr:hover {
  background: #224;
}

.mosaic-example th {
  color: #111;
  text-align: left;
  vertical-align: bottom;
}

.mosaic-example td,
.mosaic-example th {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding: 3px 6.5px 3px 0;
}

.dark .mosaic-example td,
.dark .mosaic-example th {
  color: #ccc;
}

.mosaic-example tbody tr:first-child td {
  padding-top: 4px;
}

.mosaic-example td,
.mosaic-example th {
  border: none
}

.mosaic-example td,
.mosaic-example tr:not(:last-child) th {
  border-bottom: solid 1px #eee;
}

.dark .mosaic-example td,
.dark .mosaic-example tr:not(:last-child) th {
  border-bottom: solid 1px #333;
}

.mosaic-example td {
  color: #444;
  vertical-align: top;
}
</style>

<template>
<div class="mosaic-example" ref="view">
  <em>Loading Example...</em> ⏳
</div>
</template>
