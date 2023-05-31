<script>
import yaml from 'yaml';
import { coordinator, parseJSON, wasmConnector } from '@uwdata/vgplot';

export default {
  async mounted() {
    try {
      const mc = coordinator();
      if (!mc.databaseConnector()?.db) {
        // update if current connector is not a WASM connector
        mc.databaseConnector(await wasmConnector());
      }
      const base = location.origin + import.meta.env.BASE_URL;
      const url = base.slice(0, -1) + this.spec;
      const spec = yaml.parse(await fetch(url).then(r => r.text()));
      const view = await parseJSON(spec, { baseURL: base });
      this.$refs.view.replaceChildren(view);
    } catch (err) {
      this.$refs.view.innerHTML = `<em>Example failed to load.</em> 😭<br/>
      <em>Try using Chrome if you're on a different browser.</em>`;
      console.error(err);
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
}

.mosaic-example .plot-d6a7b5 {
  background: none !important;
}

.mosaic-example label { margin-right: 0.5em; }

.mosaic-example .input {
  margin-right: 1em;
}

.mosaic-example .input > * {
  vertical-align: middle;
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
