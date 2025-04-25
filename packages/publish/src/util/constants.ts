export type HTMLTemplateOptions = {
  title: string;
  isInteractive: boolean;
  needsClientReady: boolean;
  element?: HTMLElement | SVGElement;
  css?: string;
};
export const htmlTemplate = (options: HTMLTemplateOptions) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>${options.title}</title>
</head>
<body>
  <article class="mosaic">
    ${options.isInteractive ? '<div class="ssr"></div>' : ''}
    ${options.element?.outerHTML ?? ''}
  </article>
</body>
${options.isInteractive ? `
<script type="module">
${options.needsClientReady ?
      `  import {default as visualization, clientsReady} from './index.js';

  clientsReady().then(() => {
    document.querySelector('.mosaic')?.replaceChildren(visualization);
  });` :
      `  import {default as visualization} from './index.js';

  document.querySelector('.mosaic')?.replaceChildren(visualization);`}
</script>` : ''}
${options.css}
</html>`;

export const templateCSS = `<style>
.mosaic {
  position: relative;
  margin-top: 1.5em;
  margin-bottom: 1em;
}

.mosaic .ssr {
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.2);
}

.mosaic .plot,
.mosaic .legend,
.mosaic .legend svg {
  background: none !important;
  line-height: initial;
  user-select: none;
}

.mosaic .plot-d6a7b5 {
  background: none !important;
}

.mosaic label {
  margin-right: 0.5em;
}

.mosaic .input {
  margin-right: 1em;
}

.mosaic .input > * {
  vertical-align: middle;
}

.mosaic select {
  -webkit-appearance: auto;
  appearance: auto;
}

.mosaic button,
.mosaic input,
.mosaic optgroup,
.mosaic select,
.mosaic textarea {
  padding: revert;
  border: revert;
}

.mosaic input[type=text] {
  border: 1px solid #aaa;
  border-radius: 4px;
  padding-left: 4px;
}

.mosaic table {
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

.mosaic thead tr th {
  position: sticky;
  top: 0;
  background: #fff;
  cursor: ns-resize;
  border-bottom: solid 1px #ccc;
}

.dark .mosaic thead tr th {
  background: rgb(30, 30, 32);
  border-bottom: solid 1px #444;
}

.mosaic tbody tr:hover {
  background: #eef;
}

.dark .mosaic tbody tr:hover {
  background: #224;
}

.mosaic th {
  color: #111;
  text-align: left;
  vertical-align: bottom;
}

.mosaic td,
.mosaic th {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding: 3px 6.5px 3px 0;
}

.dark .mosaic td,
.dark .mosaic th {
  color: #ccc;
}

.mosaic tbody tr:first-child td {
  padding-top: 4px;
}

.mosaic td,
.mosaic th {
  border: none
}

.mosaic td,
.mosaic tr:not(:last-child) th {
  border-bottom: solid 1px #eee;
}

.dark .mosaic td,
.dark .mosaic tr:not(:last-child) th {
  border-bottom: solid 1px #333;
}

.mosaic td {
  color: #444;
  vertical-align: top;
}
</style>`;

// export const VGPLOT = 'https://cdn.jsdelivr.net/npm/@uwdata/vgplot@latest/dist/vgplot.js';
// export const FLECHETTE = 'https://cdn.jsdelivr.net/npm/@uwdata/flechette@latest/dist/flechette.js';
export const VGPLOT = '@uwdata/vgplot';
export const FLECHETTE = '@uwdata/flechette';

// TODO: switch this to ./renderHelpers version when changes pushed to npm
// Currently, this is hack to see when clients are ready use .pending when it is available
const clientsReady = `export function clientsReady() {
  const clients = [...vg.coordinator().clients];
  return Promise.allSettled(clients.map(c => c.initialize()))
}`

const loadCache = (cacheFile: string) => `
const cacheBytes = await fetch(window.location.origin + "/${cacheFile}").then(res => res.arrayBuffer());
vg.coordinator().manager.cache().import(tableFromIPC(cacheBytes).get(0).cache);`;

export type PreambleOptions = { needsClientReady: boolean, cacheFile?: string };
export const preamble = (options: PreambleOptions) => {
  if (!options.needsClientReady && !options.cacheFile) {
    return undefined
  }
  return `
${options.needsClientReady ? clientsReady : ''}
${options.cacheFile ? loadCache(options.cacheFile) : ''}
`
}

export enum Optimizations {
  PREAGREGATE = 'preaggregate',
  PROJECTION = 'projection',
  DATASHAKE = 'datashake',
  LOAD_CACHE = 'loadCache',
  PRERENDER = 'prerender',
}

export const OPTIMIZATION_LEVEL_TO_OPTIMIZATIONS = {
  none: [],
  minimal: [Optimizations.PROJECTION, Optimizations.DATASHAKE],
  more: [Optimizations.PROJECTION, Optimizations.DATASHAKE, Optimizations.PREAGREGATE],
  most: [Optimizations.PROJECTION, Optimizations.DATASHAKE, Optimizations.PREAGREGATE, Optimizations.LOAD_CACHE, Optimizations.PRERENDER],
};