<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

<style>
.plot-why {
  margin-top: 2em;
}
.plot-why text,
.plot-why tspan {
  white-space: pre;
}
.plot-why-swatches {
  font-family: system-ui, sans-serif;
  font-size: 10px;
}
.plot-why-swatch > svg {
  margin-right: 0.5em;
  overflow: visible;
}
.plot-why-swatches-wrap {
  display: flex;
  align-items: center;
  min-height: 33px;
  flex-wrap: wrap;
}
.plot-why-swatches-wrap .plot-why-swatch {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}
</style>

# Why Mosaic?

Though many expressive visualization tools exist, scalability to large datasets and interoperability across tools remain challenging.
The visualization community lacks open, standardized tools for integrating visualization specifications with scalable analytic databases.
While libraries like [D3](https://d3js.org) embrace Web standards for cross-tool interoperability, higher-level frameworks often make closed-world assumptions, complicating integration with other tools and environments.

## Mosaic is scalable

Visualization tools such as [ggplot2](https://ggplot2.tidyverse.org/), [Vega-Lite / Altair](https://vega.github.io/vega-lite/), and [Observable Plot](https://observablehq.com/plot/) support an expressive range of visualizations with a concise syntax.
However, these tools were not designed to handle millions of data points.
Mosaic provides greater scalability by pushing data-heavy computation to a backing [DuckDB](/duckdb/) database.
Mosaic improves performance further by caching results and, when possible, performing automatic query optimization.

The figure below shows render times for static plots over increasing dataset sizes.
Mosaic provides faster results, often by one or more orders of magnitude.
DuckDB-WASM in the browser fares well, though is limited (compared to a DuckDB server) by WebAssembly's lack of parallel processing.
[VegaFusion](https://vegafusion.io/) performs server-side optimization for _bars_ and _2D histograms_, but otherwise provides results identical to Vega-Lite.

<svg xmlns="http://www.w3.org/2000/svg" class="plot-why" fill="currentColor" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" viewBox="0 0 800 115">
  <g aria-label="facet" transform="translate(2,0)">
    <g aria-label="fx-axis tick label" transform="translate(0,-9)"><text transform="translate(97.5,1)">bar</text></g>
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="155" y1="78.81569997924379" y2="78.81569997924379"></line><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line><line x1="40" x2="155" y1="37.72810000691874" y2="37.72810000691874"></line><line x1="40" x2="155" y1="17.184300020756197" y2="17.184300020756197"></line></g>
    <g aria-label="y-axis tick" fill="none" stroke="currentColor"><path transform="translate(40,78.81569997924379)" d="M0,0L-6,0"></path><path transform="translate(40,58.27189999308126)" d="M0,0L-6,0"></path><path transform="translate(40,37.72810000691874)" d="M0,0L-6,0"></path><path transform="translate(40,17.184300020756197)" d="M0,0L-6,0"></path></g>
    <g aria-label="y-axis tick label" text-anchor="end" font-variant="tabular-nums" transform="translate(-9,0)"><text y="0.32em" transform="translate(40,78.81569997924379)">0.01s</text><text y="0.32em" transform="translate(40,58.27189999308126)">0.1s</text><text y="0.32em" transform="translate(40,37.72810000691874)">1s</text><text y="0.32em" transform="translate(40,17.184300020756197)">10s</text></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(81.66666666666666,95)" d="M0,0L0,6"></path><path transform="translate(113.33333333333331,95)" d="M0,0L0,6"></path><path transform="translate(145,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">10k</text><text y="0.71em" transform="translate(81.66666666666666,95)">100k</text><text y="0.71em" transform="translate(113.33333333333331,95)">1M</text><text y="0.71em" transform="translate(145,95)">10M</text></g>
    <g aria-label="rule" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="5,5"><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line></g>
    <g aria-label="line" clip-path="url(#plot-clip-1)"><clipPath id="plot-clip-1"><rect x="40" y="1" width="115" height="94"></rect></clipPath>
    <g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#76b7b2" d="M50,74.402C60.556,74.429,71.111,74.457,81.667,74.484C92.222,74.511,102.778,74.567,113.333,74.567C123.889,74.567,134.444,71.481,145,68.396"></path><path stroke="#4e79a7" d="M50,74.348C60.556,74.513,71.111,74.678,81.667,74.678C92.222,74.678,102.778,72.011,113.333,68.191C123.889,64.37,134.444,58.064,145,51.757"></path><path stroke="#f28e2c" d="M50,80.919C60.556,80.524,71.111,80.13,81.667,78.552C92.222,76.974,102.778,64.013,113.333,56.803C123.889,49.593,134.444,42.442,145,35.292"></path><path stroke="#e15759" d="M50,81.809C60.556,79.078,71.111,76.348,81.667,71.64C92.222,66.932,102.778,60.301,113.333,53.561C123.889,46.822,134.444,39.012,145,31.202"></path><path stroke="#ff9da6" d="M50,81.243C60.556,80.969,71.111,80.694,81.667,79.597C92.222,78.499,102.778,73.246,113.333,68.184C123.889,63.121,134.444,56.171,145,49.222"></path></g></g>
    <g aria-label="dot" clip-path="url(#plot-clip-2)"><clipPath id="plot-clip-2"><rect x="40" y="1" width="115" height="94"></rect></clipPath><g><circle cx="50" cy="74.40199091723844" r="2" fill="#76b7b2"></circle><circle cx="81.66666666666666" cy="74.48397061580536" r="2" fill="#76b7b2"></circle><circle cx="113.33333333333331" cy="74.56671056990112" r="2" fill="#76b7b2"></circle><circle cx="145" cy="68.39627541569831" r="2" fill="#76b7b2"></circle><circle cx="50" cy="74.34775332911157" r="2" fill="#4e79a7"></circle><circle cx="113.33333333333331" cy="68.19053088839738" r="2" fill="#4e79a7"></circle><circle cx="145" cy="51.75699389789707" r="2" fill="#4e79a7"></circle><circle cx="50" cy="80.91882856670104" r="2" fill="#f28e2c"></circle><circle cx="81.66666666666666" cy="78.55197459219718" r="2" fill="#f28e2c"></circle><circle cx="113.33333333333331" cy="56.80273468676258" r="2" fill="#f28e2c"></circle><circle cx="145" cy="35.29204005097712" r="2" fill="#f28e2c"></circle><circle cx="50" cy="81.80880747104848" r="2" fill="#e15759"></circle><circle cx="81.66666666666666" cy="71.64021230576313" r="2" fill="#e15759"></circle><circle cx="113.33333333333331" cy="53.56125197604203" r="2" fill="#e15759"></circle><circle cx="145" cy="31.20245350048731" r="2" fill="#e15759"></circle><circle cx="50" cy="81.24289127665826" r="2" fill="#ff9da6"></circle><circle cx="81.66666666666666" cy="79.59666516533738" r="2" fill="#ff9da6"></circle><circle cx="113.33333333333331" cy="68.18370866624217" r="2" fill="#ff9da6"></circle><circle cx="145" cy="49.22166513883117" r="2" fill="#ff9da6"></circle><circle cx="81.66666666666666" cy="74.67823775279466" r="2" fill="#4e79a7"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(97.5,1)">average bars</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="1" width="115" height="94"></rect>
  </g>
  <g aria-label="facet" transform="translate(130,0)">
    <g aria-label="fx-axis tick label" transform="translate(0,-9)"><text transform="translate(97.5,1)">regression</text></g>
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="155" y1="78.81569997924379" y2="78.81569997924379"></line><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line><line x1="40" x2="155" y1="37.72810000691874" y2="37.72810000691874"></line><line x1="40" x2="155" y1="17.184300020756197" y2="17.184300020756197"></line></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(81.66666666666666,95)" d="M0,0L0,6"></path><path transform="translate(113.33333333333331,95)" d="M0,0L0,6"></path><path transform="translate(145,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">10k</text><text y="0.71em" transform="translate(81.66666666666666,95)">100k</text><text y="0.71em" transform="translate(113.33333333333331,95)">1M</text><text y="0.71em" transform="translate(145,95)">10M</text></g>
    <g aria-label="rule" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="5,5"><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line></g>
    <g aria-label="line" clip-path="url(#plot-clip-3)"><clipPath id="plot-clip-3"><rect x="40" y="1" width="115" height="94"></rect></clipPath>
    <g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#76b7b2" d="M50,74.539C60.556,74.609,71.111,74.678,81.667,74.678C92.222,74.678,102.778,74.577,113.333,74.375C123.889,74.173,134.444,66.643,145,59.113"></path><path stroke="#4e79a7" d="M50,74.457C60.556,74.526,71.111,74.594,81.667,74.594C92.222,74.594,102.778,70.734,113.333,66.173C123.889,61.612,134.444,54.42,145,47.228"></path><path stroke="#f28e2c" d="M50,81.685C60.556,77.336,71.111,72.987,81.667,67.059C92.222,61.131,102.778,53.385,113.333,46.118C123.889,38.851,134.444,31.154,145,23.457"></path><path stroke="#e15759" d="M50,81.032C60.556,78.666,71.111,76.3,81.667,70.658C92.222,65.017,102.778,55.128,113.333,47.184C123.889,39.24,134.444,31.117,145,22.994"></path></g></g>
    <g aria-label="dot" clip-path="url(#plot-clip-4)"><clipPath id="plot-clip-4"><rect x="40" y="1" width="115" height="94"></rect></clipPath><g><circle cx="50" cy="74.53904520902323" r="2" fill="#76b7b2"></circle><circle cx="113.33333333333331" cy="74.37483092531761" r="2" fill="#76b7b2"></circle><circle cx="145" cy="59.11334543694842" r="2" fill="#76b7b2"></circle><circle cx="50" cy="74.45656030092634" r="2" fill="#4e79a7"></circle><circle cx="81.66666666666666" cy="74.5944619487965" r="2" fill="#4e79a7"></circle><circle cx="113.33333333333331" cy="66.17255337156944" r="2" fill="#4e79a7"></circle><circle cx="145" cy="47.22822578117591" r="2" fill="#4e79a7"></circle><circle cx="50" cy="81.68488803791806" r="2" fill="#f28e2c"></circle><circle cx="81.66666666666666" cy="67.05867622681409" r="2" fill="#f28e2c"></circle><circle cx="113.33333333333331" cy="46.117755716421016" r="2" fill="#f28e2c"></circle><circle cx="145" cy="23.457188334480247" r="2" fill="#f28e2c"></circle><circle cx="50" cy="81.03248686536216" r="2" fill="#e15759"></circle><circle cx="81.66666666666666" cy="70.65836202474505" r="2" fill="#e15759"></circle><circle cx="113.33333333333331" cy="47.184344600253056" r="2" fill="#e15759"></circle><circle cx="145" cy="22.994082985116805" r="2" fill="#e15759"></circle><circle cx="81.66666666666666" cy="74.67823775279466" r="2" fill="#76b7b2"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(97.5,1)">linear regression</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="1" width="115" height="94"></rect>
  </g>
    <g aria-label="facet" transform="translate(258,0)">
    <g aria-label="fx-axis tick label" transform="translate(0,-9)"><text transform="translate(97.5,1)">histogram</text></g>
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="155" y1="78.81569997924379" y2="78.81569997924379"></line><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line><line x1="40" x2="155" y1="37.72810000691874" y2="37.72810000691874"></line><line x1="40" x2="155" y1="17.184300020756197" y2="17.184300020756197"></line></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(81.66666666666666,95)" d="M0,0L0,6"></path><path transform="translate(113.33333333333331,95)" d="M0,0L0,6"></path><path transform="translate(145,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">10k</text><text y="0.71em" transform="translate(81.66666666666666,95)">100k</text><text y="0.71em" transform="translate(113.33333333333331,95)">1M</text><text y="0.71em" transform="translate(145,95)">10M</text></g>
    <g aria-label="rule" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="5,5"><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line></g>
    <g aria-label="line" clip-path="url(#plot-clip-5)"><clipPath id="plot-clip-5"><rect x="40" y="1" width="115" height="94"></rect></clipPath>
    <g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#76b7b2" d="M50,73.951C60.556,74.204,71.111,74.457,81.667,74.457C92.222,74.457,102.778,74.237,113.333,73.797C123.889,73.358,134.444,67.665,145,61.972"></path><path stroke="#4e79a7" d="M50,74.706C60.556,74.706,71.111,74.706,81.667,74.706C92.222,74.706,102.778,65.777,113.333,60.032C123.889,54.286,134.444,47.259,145,40.231"></path><path stroke="#f28e2c" d="M50,81.998C60.556,78.51,71.111,75.023,81.667,69.347C92.222,63.671,102.778,55.39,113.333,47.943C123.889,40.496,134.444,32.582,145,24.667"></path><path stroke="#e15759" d="M50,73.977C60.556,68.407,71.111,62.838,81.667,56.335C92.222,49.832,102.778,42.412,113.333,34.959C123.889,27.506,134.444,19.562,145,11.618"></path><path stroke="#ff9da6" d="M50,78.441C60.556,78.039,71.111,77.637,81.667,76.03C92.222,74.422,102.778,71.513,113.333,67.002C123.889,62.491,134.444,55.727,145,48.963"></path></g></g>
    <g aria-label="dot" clip-path="url(#plot-clip-6)"><clipPath id="plot-clip-6"><rect x="40" y="1" width="115" height="94"></rect></clipPath><g><circle cx="50" cy="73.95115208207572" r="2" fill="#76b7b2"></circle><circle cx="81.66666666666666" cy="74.45656023567527" r="2" fill="#76b7b2"></circle><circle cx="113.33333333333331" cy="73.79731966223473" r="2" fill="#76b7b2"></circle><circle cx="145" cy="61.97239670939086" r="2" fill="#76b7b2"></circle><circle cx="50" cy="74.70633872236363" r="2" fill="#4e79a7"></circle><circle cx="81.66666666666666" cy="74.70633872236363" r="2" fill="#4e79a7"></circle><circle cx="113.33333333333331" cy="60.03161704455208" r="2" fill="#4e79a7"></circle><circle cx="145" cy="40.23139832533656" r="2" fill="#4e79a7"></circle><circle cx="50" cy="81.99797486265545" r="2" fill="#f28e2c"></circle><circle cx="81.66666666666666" cy="69.34710687255874" r="2" fill="#f28e2c"></circle><circle cx="113.33333333333331" cy="47.94312629090173" r="2" fill="#f28e2c"></circle><circle cx="145" cy="24.667171273428323" r="2" fill="#f28e2c"></circle><circle cx="50" cy="73.9770506501889" r="2" fill="#e15759"></circle><circle cx="81.66666666666666" cy="56.334693665369656" r="2" fill="#e15759"></circle><circle cx="113.33333333333331" cy="34.95882760842503" r="2" fill="#e15759"></circle><circle cx="145" cy="11.618004403333714" r="2" fill="#e15759"></circle><circle cx="50" cy="78.44110462189926" r="2" fill="#ff9da6"></circle><circle cx="113.33333333333331" cy="67.0023499372637" r="2" fill="#ff9da6"></circle><circle cx="145" cy="48.96294322718538" r="2" fill="#ff9da6"></circle><circle cx="81.66666666666666" cy="76.02969482219238" r="2" fill="#ff9da6"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(97.5,1)">histogram 2d</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="1" width="115" height="94"></rect>
  </g>
  <g aria-label="facet" transform="translate(386,0)">
    <g aria-label="fx-axis tick label" transform="translate(0,-9)"><text transform="translate(97.5,1)">area</text></g>
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="155" y1="78.81569997924379" y2="78.81569997924379"></line><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line><line x1="40" x2="155" y1="37.72810000691874" y2="37.72810000691874"></line><line x1="40" x2="155" y1="17.184300020756197" y2="17.184300020756197"></line></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(81.66666666666666,95)" d="M0,0L0,6"></path><path transform="translate(113.33333333333331,95)" d="M0,0L0,6"></path><path transform="translate(145,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">10k</text><text y="0.71em" transform="translate(81.66666666666666,95)">100k</text><text y="0.71em" transform="translate(113.33333333333331,95)">1M</text><text y="0.71em" transform="translate(145,95)">10M</text></g>
    <g aria-label="rule" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="5,5"><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line></g>
    <g aria-label="line" clip-path="url(#plot-clip-7)"><clipPath id="plot-clip-7"><rect x="40" y="1" width="115" height="94"></rect></clipPath>
    <g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#76b7b2" d="M50,73.721C60.556,73.981,71.111,74.24,81.667,74.24C92.222,74.24,102.778,74.196,113.333,74.108C123.889,74.019,134.444,67.349,145,60.679"></path><path stroke="#4e79a7" d="M50,74.622C60.556,74.559,71.111,74.495,81.667,74.24C92.222,73.986,102.778,65.315,113.333,59.576C123.889,53.838,134.444,46.824,145,39.81"></path><path stroke="#f28e2c" d="M50,77.647L81.667,55.849"></path><path stroke="#e15759" d="M50,68.424L81.667,48.107"></path></g></g>
    <g aria-label="dot" clip-path="url(#plot-clip-8)"><clipPath id="plot-clip-8"><rect x="40" y="1" width="115" height="94"></rect></clipPath><g><circle cx="50" cy="73.72138676915544" r="2" fill="#76b7b2"></circle><circle cx="81.66666666666666" cy="74.24025731688864" r="2" fill="#76b7b2"></circle><circle cx="113.33333333333331" cy="74.10768345366702" r="2" fill="#76b7b2"></circle><circle cx="145" cy="60.67944761108077" r="2" fill="#76b7b2"></circle><circle cx="50" cy="74.62229988238151" r="2" fill="#4e79a7"></circle><circle cx="81.66666666666666" cy="74.2402573805768" r="2" fill="#4e79a7"></circle><circle cx="113.33333333333331" cy="59.576148971926905" r="2" fill="#4e79a7"></circle><circle cx="50" cy="77.64665806715571" r="2" fill="#f28e2c"></circle><circle cx="81.66666666666666" cy="55.84909087118312" r="2" fill="#f28e2c"></circle><circle cx="50" cy="68.42407003761036" r="2" fill="#e15759"></circle><circle cx="81.66666666666666" cy="48.10722776682555" r="2" fill="#e15759"></circle><circle cx="145" cy="39.80979621396995" r="2" fill="#4e79a7"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(97.5,1)">area chart</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="1" width="115" height="94"></rect>
  </g>
  <g aria-label="facet" transform="translate(514,0)">
    <g aria-label="fx-axis tick label" transform="translate(0,-9)"><text transform="translate(97.5,1)">density</text></g>
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="155" y1="78.81569997924379" y2="78.81569997924379"></line><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line><line x1="40" x2="155" y1="37.72810000691874" y2="37.72810000691874"></line><line x1="40" x2="155" y1="17.184300020756197" y2="17.184300020756197"></line></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(81.66666666666666,95)" d="M0,0L0,6"></path><path transform="translate(113.33333333333331,95)" d="M0,0L0,6"></path><path transform="translate(145,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">10k</text><text y="0.71em" transform="translate(81.66666666666666,95)">100k</text><text y="0.71em" transform="translate(113.33333333333331,95)">1M</text><text y="0.71em" transform="translate(145,95)">10M</text></g>
    <g aria-label="rule" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="5,5"><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line></g>
    <g aria-label="line" clip-path="url(#plot-clip-9)"><clipPath id="plot-clip-9"><rect x="40" y="1" width="115" height="94"></rect></clipPath>
    <g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#76b7b2" d="M50,61.972C60.556,60.535,71.111,59.099,81.667,59.079C92.222,59.06,102.778,59.069,113.333,59.05C123.889,59.03,134.444,53.8,145,48.569"></path><path stroke="#4e79a7" d="M50,65.406C60.556,64.088,71.111,62.771,81.667,60.263C92.222,57.755,102.778,55.113,113.333,50.359C123.889,45.606,134.444,38.673,145,31.741"></path><path stroke="#f28e2c" d="M50,74.134C60.556,71.178,71.111,68.223,81.667,62.927C92.222,57.631,102.778,49.544,113.333,42.358C123.889,35.172,134.444,27.491,145,19.81"></path><path stroke="#e15759" d="M50,70.569C60.556,68.862,71.111,67.154,81.667,62.785C92.222,58.416,102.778,51.435,113.333,44.357C123.889,37.279,134.444,28.798,145,20.318"></path></g></g>
    <g aria-label="dot" clip-path="url(#plot-clip-10)"><clipPath id="plot-clip-10"><rect x="40" y="1" width="115" height="94"></rect></clipPath><g><circle cx="50" cy="61.97239670939086" r="2" fill="#76b7b2"></circle><circle cx="81.66666666666666" cy="59.07909565185112" r="2" fill="#76b7b2"></circle><circle cx="113.33333333333331" cy="59.0498429663067" r="2" fill="#76b7b2"></circle><circle cx="145" cy="48.56870279195148" r="2" fill="#76b7b2"></circle><circle cx="50" cy="65.40615167236552" r="2" fill="#4e79a7"></circle><circle cx="81.66666666666666" cy="60.26279991697519" r="2" fill="#4e79a7"></circle><circle cx="113.33333333333331" cy="50.35926563287021" r="2" fill="#4e79a7"></circle><circle cx="145" cy="31.741136348951372" r="2" fill="#4e79a7"></circle><circle cx="50" cy="74.13404111274168" r="2" fill="#f28e2c"></circle><circle cx="81.66666666666666" cy="62.926699331224206" r="2" fill="#f28e2c"></circle><circle cx="113.33333333333331" cy="42.35812938853001" r="2" fill="#f28e2c"></circle><circle cx="145" cy="19.80967808790197" r="2" fill="#f28e2c"></circle><circle cx="50" cy="70.5694075804139" r="2" fill="#e15759"></circle><circle cx="81.66666666666666" cy="62.78501719995191" r="2" fill="#e15759"></circle><circle cx="113.33333333333331" cy="44.356903206537254" r="2" fill="#e15759"></circle><circle cx="145" cy="20.317828176318848" r="2" fill="#e15759"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(97.5,1)">density contours</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="1" width="115" height="94"></rect>
  </g>
  <g aria-label="facet" transform="translate(642,0)">
    <g aria-label="fx-axis tick label" transform="translate(0,-9)"><text transform="translate(97.5,1)">hexbin</text></g>
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="155" y1="78.81569997924379" y2="78.81569997924379"></line><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line><line x1="40" x2="155" y1="37.72810000691874" y2="37.72810000691874"></line><line x1="40" x2="155" y1="17.184300020756197" y2="17.184300020756197"></line></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(81.66666666666666,95)" d="M0,0L0,6"></path><path transform="translate(113.33333333333331,95)" d="M0,0L0,6"></path><path transform="translate(145,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">10k</text><text y="0.71em" transform="translate(81.66666666666666,95)">100k</text><text y="0.71em" transform="translate(113.33333333333331,95)">1M</text><text y="0.71em" transform="translate(145,95)">10M</text></g>
    <g aria-label="rule" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="5,5"><line x1="40" x2="155" y1="58.27189999308126" y2="58.27189999308126"></line></g>
    <g aria-label="line" clip-path="url(#plot-clip-11)"><clipPath id="plot-clip-11"><rect x="40" y="1" width="115" height="94"></rect></clipPath>
    <g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#76b7b2" d="M50,66.905C60.556,66.25,71.111,65.595,81.667,65.075C92.222,64.555,102.778,64.645,113.333,63.786C123.889,62.927,134.444,56.149,145,49.372"></path><path stroke="#4e79a7" d="M50,68.65C60.556,65.985,71.111,63.32,81.667,58.876C92.222,54.432,102.778,48.026,113.333,41.985C123.889,35.943,134.444,29.285,145,22.628"></path><path stroke="#f28e2c" d="M50,73.747C60.556,70.864,71.111,67.981,81.667,62.8C92.222,57.618,102.778,49.81,113.333,42.658C123.889,35.507,134.444,27.698,145,19.89"></path></g></g>
    <g aria-label="dot" clip-path="url(#plot-clip-12)"><clipPath id="plot-clip-12"><rect x="40" y="1" width="115" height="94"></rect></clipPath><g><circle cx="50" cy="66.90474173509011" r="2" fill="#76b7b2"></circle><circle cx="81.66666666666666" cy="65.07494550518125" r="2" fill="#76b7b2"></circle><circle cx="113.33333333333331" cy="63.78608671907035" r="2" fill="#76b7b2"></circle><circle cx="145" cy="49.37212843918089" r="2" fill="#76b7b2"></circle><circle cx="50" cy="68.64960011069975" r="2" fill="#4e79a7"></circle><circle cx="81.66666666666666" cy="58.87631285306755" r="2" fill="#4e79a7"></circle><circle cx="113.33333333333331" cy="41.98453353839824" r="2" fill="#4e79a7"></circle><circle cx="145" cy="22.627673435090056" r="2" fill="#4e79a7"></circle><circle cx="50" cy="73.7466260270855" r="2" fill="#f28e2c"></circle><circle cx="81.66666666666666" cy="62.79982558586188" r="2" fill="#f28e2c"></circle><circle cx="113.33333333333331" cy="42.65845598595953" r="2" fill="#f28e2c"></circle><circle cx="145" cy="19.88996840980413" r="2" fill="#f28e2c"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(97.5,1)">hexbins</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="1" width="115" height="94"></rect>
  </g>
</svg>
<div style="display: flex; flex-flow: row nowrap; justify-content: flex-start; align-items: flex-start;"><span style="display: inline-block; width: 35px;"></span><div class="legend"><div class="plot-why-swatches plot-why-swatches-wrap"><span class="plot-why-swatch"><svg width="15" height="15" fill="#e15759"><rect width="100%" height="100%"></rect></svg>Vega(-Lite)</span><span class="plot-why-swatch"><svg width="15" height="15" fill="#ff9da6"><rect width="100%" height="100%"></rect></svg>VegaFusion</span><span class="plot-why-swatch"><svg width="15" height="15" fill="#f28e2c"><rect width="100%" height="100%"></rect></svg>Observable Plot</span><span class="plot-why-swatch"><svg width="15" height="15" fill="#4e79a7"><rect width="100%" height="100%"></rect></svg>Mosaic WASM</span><span class="plot-why-swatch"><svg width="15" height="15" fill="#76b7b2"><rect width="100%" height="100%"></rect></svg>Mosaic Local</span></div></div></div>

When it comes to interaction, Mosaic really shines!
For many forms of aggregated data, the coordinator will automatically pre-aggregate data into smaller tables ("materialized views") to support real-time interaction with billion+ element databases.
The figure below shows benchmark results for optimized interactive updates.
Even with billions of rows, Mosaic with a server-side DuckDB instance maintains interactive response rates.

<svg xmlns="http://www.w3.org/2000/svg" class="plot-why" fill="currentColor" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle" width="420" height="115" viewBox="0 0 420 115">
  <g aria-label="facet" transform="translate(1,0)">
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="157" y1="78.40572092494686" y2="78.40572092494686"></line><line x1="40" x2="157" y1="56.5" y2="56.5"></line><line x1="40" x2="157" y1="34.59427907505314" y2="34.59427907505314"></line></g>
    <g aria-label="y-axis tick" fill="none" stroke="currentColor"><path transform="translate(40,78.40572092494686)" d="M0,0L-6,0"></path><path transform="translate(40,56.5)" d="M0,0L-6,0"></path><path transform="translate(40,34.59427907505314)" d="M0,0L-6,0"></path></g>
    <g aria-label="y-axis tick label" text-anchor="end" font-variant="tabular-nums" transform="translate(-9,0)"><text y="0.32em" transform="translate(40,78.40572092494686)">0.01s</text><text y="0.32em" transform="translate(40,56.5)">0.1s</text><text y="0.32em" transform="translate(40,34.59427907505314)">1s</text></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(80.63834987272958,95)" d="M0,0L0,6"></path><path transform="translate(111.27669974545915,95)" d="M0,0L0,6"></path><path transform="translate(141.9150496181887,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">1M</text><text y="0.71em" transform="translate(80.63834987272958,95)">10M</text><text y="0.71em" transform="translate(111.27669974545915,95)">100M</text><text y="0.71em" transform="translate(141.9150496181887,95)">1G</text></g>
    <g aria-label="rule" stroke="#aaa" stroke-dasharray="5,5"><line x1="40" x2="157" y1="56.5" y2="56.5"></line></g>
    <g aria-label="line" clip-path="url(#iplot-clip-1)"><clipPath id="iplot-clip-1"><rect x="40" y="18" width="117" height="77"></rect></clipPath><g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#76b7b2" d="M50,79.952C60.213,79.524,70.426,79.096,80.638,79.096C90.851,79.096,101.064,79.841,111.277,79.841C121.489,79.841,131.702,79.786,141.915,79.731"></path><path stroke="#59a14f" d="M50,73.302C60.213,73.302,70.426,73.302,80.638,73.302C90.851,73.302,101.064,72.553,111.277,72.553C121.489,72.553,131.702,72.9,141.915,73.246"></path><path stroke="#4e79a7" d="M50,80.178C60.213,80.178,70.426,80.178,80.638,80.178C90.851,80.178,101.064,80.178,111.277,80.178"></path><path stroke="#ff9da6" d="M50,64.452C60.213,61.119,70.426,57.786,80.638,52.38C90.851,46.974,101.064,39.496,111.277,32.018"></path></g></g>
    <g aria-label="rule"><line x1="111.27669974545915" x2="111.27669974545915" y1="80.41042253384043" y2="79.30294872931005" stroke="#76b7b2"></line><line x1="111.27669974545915" x2="111.27669974545915" y1="73.13631623639813" y2="71.6230488984892" stroke="#59a14f"></line><line x1="111.27669974545915" x2="111.27669974545915" y1="80.52860462473431" y2="79.73059537662952" stroke="#4e79a7"></line><line x1="80.63834987272958" x2="80.63834987272958" y1="79.95185024083251" y2="73.75759850697145" stroke="#76b7b2"></line><line x1="80.63834987272958" x2="80.63834987272958" y1="73.69941156100282" y2="72.65654055968022" stroke="#59a14f"></line><line x1="80.63834987272958" x2="80.63834987272958" y1="80.52860462473431" y2="79.73059524627301" stroke="#4e79a7"></line><line x1="141.9150496181887" x2="141.9150496181887" y1="80.41042253384043" y2="77.94155405292557" stroke="#76b7b2"></line><line x1="141.9150496181887" x2="141.9150496181887" y1="73.69941149185027" y2="72.55313160351476" stroke="#59a14f"></line><line x1="50" x2="50" y1="80.41042253384043" y2="79.30294872931005" stroke="#76b7b2"></line><line x1="50" x2="50" y1="73.75759843739466" y2="72.70866971657018" stroke="#59a14f"></line><line x1="50" x2="50" y1="80.52860462473431" y2="79.73059537662952" stroke="#4e79a7"></line><line x1="50" x2="50" y1="67.42965655994503" y2="60.4818928458743" stroke="#ff9da6"></line><line x1="80.63834987272958" x2="80.63834987272958" y1="58.99886576519707" y2="45.93483208559458" stroke="#ff9da6"></line><line x1="111.27669974545915" x2="111.27669974545915" y1="42.38310810585113" y2="22.75468297866056" stroke="#ff9da6"></line></g>
    <g aria-label="dot" clip-path="url(#iplot-clip-2)"><clipPath id="iplot-clip-2"><rect x="40" y="18" width="117" height="77"></rect></clipPath><g><circle cx="111.27669974545915" cy="79.8405795457826" r="2" fill="#76b7b2"></circle><circle cx="111.27669974545915" cy="72.55313160351476" r="2" fill="#59a14f"></circle><circle cx="111.27669974545915" cy="80.17837370472641" r="2" fill="#4e79a7"></circle><circle cx="80.63834987272958" cy="79.09612458513371" r="2" fill="#76b7b2"></circle><circle cx="80.63834987272958" cy="73.30177314083389" r="2" fill="#59a14f"></circle><circle cx="80.63834987272958" cy="80.17837370472641" r="2" fill="#4e79a7"></circle><circle cx="141.9150496181887" cy="79.73059537662952" r="2" fill="#76b7b2"></circle><circle cx="141.9150496181887" cy="73.24630047072948" r="2" fill="#59a14f"></circle><circle cx="50" cy="79.95185024083251" r="2" fill="#76b7b2"></circle><circle cx="50" cy="73.30177314083389" r="2" fill="#59a14f"></circle><circle cx="50" cy="80.17837370472641" r="2" fill="#4e79a7"></circle><circle cx="50" cy="64.4520154284156" r="2" fill="#ff9da6"></circle><circle cx="80.63834987272958" cy="52.37987619905716" r="2" fill="#ff9da6"></circle><circle cx="111.27669974545915" cy="32.01810733086758" r="2" fill="#ff9da6"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(98.5,18)">flights   </text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="18" width="117" height="77"></rect>
  </g>
  <g aria-label="facet" transform="translate(131,0)">
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="157" y1="78.40572092494686" y2="78.40572092494686"></line><line x1="40" x2="157" y1="56.5" y2="56.5"></line><line x1="40" x2="157" y1="34.59427907505314" y2="34.59427907505314"></line></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(80.63834987272958,95)" d="M0,0L0,6"></path><path transform="translate(111.27669974545915,95)" d="M0,0L0,6"></path><path transform="translate(141.9150496181887,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">1M</text><text y="0.71em" transform="translate(80.63834987272958,95)">10M</text><text y="0.71em" transform="translate(111.27669974545915,95)">100M</text><text y="0.71em" transform="translate(141.9150496181887,95)">1G</text></g>
    <g aria-label="rule" stroke="#aaa" stroke-dasharray="5,5"><line x1="40" x2="157" y1="56.5" y2="56.5"></line></g>
    <g aria-label="line" clip-path="url(#iplot-clip-3)"><clipPath id="iplot-clip-3"><rect x="40" y="18" width="117" height="77"></rect></clipPath><g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#59a14f" d="M55.101,67.673C65.308,67.419,75.515,67.165,85.722,66.99C95.936,66.815,106.149,66.624,116.363,66.624C126.575,66.624,136.788,66.652,147,66.68"></path><path stroke="#76b7b2" d="M55.101,74.236C65.308,74.11,75.515,73.984,85.722,73.875C95.936,73.766,106.149,73.778,116.363,73.584C126.575,73.39,136.788,71.464,147,69.538"></path><path stroke="#4e79a7" d="M55.101,73.758L85.722,69.538"></path></g></g>
    <g aria-label="rule"><line x1="55.100731257508556" x2="55.100731257508556" y1="68.71288258786255" y2="66.96120334776107" stroke="#59a14f"></line><line x1="55.100731257508556" x2="55.100731257508556" y1="78.03259335602648" y2="73.52695606090117" stroke="#76b7b2"></line><line x1="55.100731257508556" x2="55.100731257508556" y1="79.95185024083251" y2="73.41369836781861" stroke="#4e79a7"></line><line x1="147" x2="147" y1="67.10513247298357" y2="63.26708262037291" stroke="#59a14f"></line><line x1="147" x2="147" y1="74.11439780817021" y2="64.61804990085113" stroke="#76b7b2"></line><line x1="116.36278829408977" x2="116.36278829408977" y1="67.07617192351277" y2="65.07551945923669" stroke="#59a14f"></line><line x1="116.36278829408977" x2="116.36278829408977" y1="73.99397172984575" y2="73.3017731491241" stroke="#76b7b2"></line><line x1="85.72223263812266" x2="85.72223263812266" y1="67.70366527252584" y2="66.43330986441231" stroke="#59a14f"></line><line x1="85.72223263812266" x2="85.72223263812266" y1="75.00297303071935" y2="73.47015867934753" stroke="#76b7b2"></line><line x1="85.72223263812266" x2="85.72223263812266" y1="79.51436932495386" y2="67.10513247298357" stroke="#4e79a7"></line></g>
    <g aria-label="dot" clip-path="url(#iplot-clip-4)"><clipPath id="iplot-clip-4"><rect x="40" y="18" width="117" height="77"></rect></clipPath><g><circle cx="55.100731257508556" cy="67.67282721260779" r="2" fill="#59a14f"></circle><circle cx="55.100731257508556" cy="74.23636786165723" r="2" fill="#76b7b2"></circle><circle cx="55.100731257508556" cy="73.75759848088016" r="2" fill="#4e79a7"></circle><circle cx="147" cy="66.67971731728503" r="2" fill="#59a14f"></circle><circle cx="147" cy="69.53754650821959" r="2" fill="#76b7b2"></circle><circle cx="116.36278829408977" cy="66.62440592016425" r="2" fill="#59a14f"></circle><circle cx="116.36278829408977" cy="73.58409457843375" r="2" fill="#76b7b2"></circle><circle cx="85.72223263812266" cy="66.98981549911065" r="2" fill="#59a14f"></circle><circle cx="85.72223263812266" cy="73.87505099925242" r="2" fill="#76b7b2"></circle><circle cx="85.72223263812266" cy="69.53754651101019" r="2" fill="#4e79a7"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(98.5,18)">gaia (bins)</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="18" width="117" height="77"></rect>
  </g>
  <g aria-label="facet" transform="translate(261,0)">
    <g aria-label="y-grid" stroke="currentColor" stroke-opacity="0.1"><line x1="40" x2="157" y1="78.40572092494686" y2="78.40572092494686"></line><line x1="40" x2="157" y1="56.5" y2="56.5"></line><line x1="40" x2="157" y1="34.59427907505314" y2="34.59427907505314"></line></g>
    <g aria-label="x-axis tick" fill="none" stroke="currentColor"><path transform="translate(50,95)" d="M0,0L0,6"></path><path transform="translate(80.63834987272958,95)" d="M0,0L0,6"></path><path transform="translate(111.27669974545915,95)" d="M0,0L0,6"></path><path transform="translate(141.9150496181887,95)" d="M0,0L0,6"></path></g>
    <g aria-label="x-axis tick label" font-variant="tabular-nums" transform="translate(0,9)"><text y="0.71em" transform="translate(50,95)">1M</text><text y="0.71em" transform="translate(80.63834987272958,95)">10M</text><text y="0.71em" transform="translate(111.27669974545915,95)">100M</text><text y="0.71em" transform="translate(141.9150496181887,95)">1G</text></g>
    <g aria-label="rule" stroke="#aaa" stroke-dasharray="5,5"><line x1="40" x2="157" y1="56.5" y2="56.5"></line></g>
    <g aria-label="line" clip-path="url(#iplot-clip-5)"><clipPath id="iplot-clip-5"><rect x="40" y="18" width="117" height="77"></rect></clipPath><g fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path stroke="#59a14f" d="M55.101,64.596C65.308,63.542,75.515,62.488,85.722,61.273C95.936,60.057,106.149,58.561,116.363,57.304C126.575,56.046,136.788,54.888,147,53.73"></path><path stroke="#76b7b2" d="M55.101,72.101C65.308,71.537,75.515,70.973,85.722,69.243C95.936,67.511,106.149,63.578,116.363,61.715C126.575,59.853,136.788,58.961,147,58.069"></path><path stroke="#4e79a7" d="M55.101,70.359L85.722,61.781"></path></g></g>
    <g aria-label="rule"><line x1="55.100731257508556" x2="55.100731257508556" y1="66.96120334776107" y2="61.682280351665035" stroke="#59a14f"></line><line x1="55.100731257508556" x2="55.100731257508556" y1="73.69941154371467" y2="67.3103630353548" stroke="#76b7b2"></line><line x1="55.100731257508556" x2="55.100731257508556" y1="73.41369836781861" y2="67.07617191920387" stroke="#4e79a7"></line><line x1="147" x2="147" y1="55.96362379698904" y2="49.103338564963394" stroke="#59a14f"></line><line x1="147" x2="147" y1="60.30995683385203" y2="52.124218834309076" stroke="#76b7b2"></line><line x1="116.36278829408977" x2="116.36278829408977" y1="60.11321500316293" y2="55.627921111476134" stroke="#59a14f"></line><line x1="116.36278829408977" x2="116.36278829408977" y1="65.70514326059705" y2="59.2495662736177" stroke="#76b7b2"></line><line x1="85.72223263812266" x2="85.72223263812266" y1="64.59574383399737" y2="58.215514212705195" stroke="#59a14f"></line><line x1="85.72223263812266" x2="85.72223263812266" y1="72.19980326979567" y2="62.980796215017776" stroke="#76b7b2"></line><line x1="85.72223263812266" x2="85.72223263812266" y1="65.98459958924303" y2="59.0983546050829" stroke="#4e79a7"></line></g>
    <g aria-label="dot" clip-path="url(#iplot-clip-6)"><clipPath id="iplot-clip-6"><rect x="40" y="18" width="117" height="77"></rect></clipPath><g><circle cx="55.100731257508556" cy="64.59574383399737" r="2" fill="#59a14f"></circle><circle cx="55.100731257508556" cy="72.10121655176282" r="2" fill="#76b7b2"></circle><circle cx="55.100731257508556" cy="70.35852463395668" r="2" fill="#4e79a7"></circle><circle cx="147" cy="53.729887670651124" r="2" fill="#59a14f"></circle><circle cx="147" cy="58.068540477867444" r="2" fill="#76b7b2"></circle><circle cx="116.36278829408977" cy="57.30360017077578" r="2" fill="#59a14f"></circle><circle cx="116.36278829408977" cy="61.71514233204928" r="2" fill="#76b7b2"></circle><circle cx="85.72223263812266" cy="61.272946679285845" r="2" fill="#59a14f"></circle><circle cx="85.72223263812266" cy="69.24252957366946" r="2" fill="#76b7b2"></circle><circle cx="85.72223263812266" cy="61.78120880370053" r="2" fill="#4e79a7"></circle></g></g>
    <g aria-label="text" transform="translate(0,5)"><text y="0.71em" transform="translate(98.5,18)">gaia (raster)</text></g>
    <rect aria-label="frame" fill="none" stroke="currentColor" x="40" y="18" width="117" height="77"></rect>
  </g>
  <g aria-label="fx-axis label" transform="translate(0,-15)"><text y="0.71em" transform="translate(229.5,18)">Interactive Updates</text></g>
</svg>
<div style="display: flex; flex-flow: row nowrap; justify-content: flex-start; align-items: flex-start;"><span style="display: inline-block; width: 40px;"></span><div class="legend"><div class="plot-why-swatches plot-why-swatches-wrap"><span class="plot-why-swatch"><svg width="15" height="15" fill="#ff9da6"><rect width="100%" height="100%"></rect></svg>VegaFusion</span><span class="plot-why-swatch"><svg width="15" height="15" fill="#4e79a7"><rect width="100%" height="100%"></rect></svg>Mosaic WASM</span><span class="plot-why-swatch"><svg width="15" height="15" fill="#76b7b2"><rect width="100%" height="100%"></rect></svg>Mosaic Local</span><span class="plot-why-swatch"><svg width="15" height="15" fill="#59a14f"><rect width="100%" height="100%"></rect></svg>Mosaic Remote</span></div></div></div>

If not already present, Mosaic will build pre-aggregated data tables when the mouse cursor enters a view.
For very large data sets with longer pre-aggregation times, precomputation and server-side caching are supported.

Other tasks, like changing a color encoding or adjusting a smoothing parameter, can be carried out quickly in the browser alone, including over aggregated data. Mosaic clients have the flexibility of choosing what works best.

## Mosaic is interoperable

Mosaic provides an open, "middle-tier" architecture that manages data access and linked selections between clients.
With a shared architecture, a visualization framework can readily interoperate with other libraries, including input components and other visualization tools.
We demonstrate this through the design of [vgplot](/vgplot/), a Mosaic-based grammar of interactive graphics that combines concepts from existing visualization tools.

To link across views, Mosaic provides a generalized _selection_ abstraction inspired by [Vega-Lite](https://vega.github.io/vega-lite/).
Compared to Vega-Lite, Mosaic selections are decoupled from input event handling and support more complex resolution strategies &mdash; with computation offloaded to a backing scalable database.

Importantly, Mosaic selections are first-class entities, and not internal to a single visualization language or tool.
Any component that implements the Mosaic _client_ interface can both issue queries and be automatically filtered by a provided _selection_.
Mosaic inputs and vgplot plots can freely interact, as can any other components or visualizations (such as custom [D3](https://d3js.org) plots) that follow the Mosaic client interface.

Though written in JavaScript and deployable over the Web, Mosaic was designed to work well in data science environments such as Jupyter notebooks, too. A DuckDB server can run in a host environment such as a Python kernel and communicate with a Web-based output cell interface. See the [Mosaic Jupyter Widget](/jupyter/) for more.

## Mosaic is extensible

Mosaic can readily be extended with new clients, or, as in the case of [vgplot](/vgplot/), entire component libraries.
Possible future additions include network visualization tools, WebGL/WebGPU enabled clients for more scalable rendering, and more!

As sketched in the code below, data-consuming elements (plot layers, widgets, etc) can be realized as Mosaic clients that provide queries and accept resulting data.

``` js
import { MosaicClient } from '@uwdata/mosaic-core';
import { Query } from '@uwdata/mosaic-sql';

export class CustomClient extends MosaicClient {
  /**
   * Create a new client instance, with a backing table name
   * and an optional filterBy selection.
   */
  constructor(tableName, filterBy) {
    super(filterBy);
    this.tableName = tableName;
  }

  /**
   * Return a SQL query for the client's data needs,
   * ideally using @uwdata/mosaic-sql query helpers.
   * Be sure to incorporate the given filter criteria.
   */
  query(filter = []) {
    return Query
      .from(this.tableName)
      .select(/* desired columns here */)
      .where(filter);
  }

  /**
   * Process query result data. This method is called by the
   * coordinator to pass query results from the database.
   */
  queryResult(data) {
    // visualize, analyze, ...
  }
}
```

If you are interested in creating your own Mosaic clients, see the [Mosaic GitHub repository](https://github.com/uwdata/mosaic).
For concrete examples, start with the source code of [Mosaic inputs](https://github.com/uwdata/mosaic/tree/main/packages/inputs/src).
Once you've instantiated a custom client, register it using [`coordinator.connect(client)`](/api/core/coordinator.html#connect).

Mosaic can also be extended with additional database connectors, and &ndash; though not for the faint of heart! &ndash; even the central coordinator can be replaced to experiment with alternative query management and optimization schemes.