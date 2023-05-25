# What is Mosaic?

Though many expressive visualization tools exist, scalability to large datasets and interoperability across tools remain challenging.
The visualization community lacks open, standardized tools for integrating visualization specifications with scalable analytic databases.
While libraries like [D3](https://d3js.org) embrace Web standards for cross-tool interoperability, higher-level frameworks often make closed-world assumptions, complicating integration with other tools and environments.

Mosaic provides a "middle-tier" architecture for interoperable, data-driven components&mdash;including visualizations, tables, and input widgets&mdash;backed by scalable data stores.
We use the Web browser as the primary site of rendering and interaction, from which we can coordinate diverse components via standard protocols for communicating data needs, dynamic parameters, and linked selection criteria.

A key idea of Mosaic is to decouple data processing from visualization specification.
Mosaic _Clients_ communicate their data needs as declarative queries.
A central _Coordinator_ manages these queries, applying automatic optimizations and pushing processing to a backing _Data Source_.
Dynamic _Params_ and _Selections_ enable coordinated updates to both clients and queries to support linked interaction.
As an open and extensible architecture, a variety of components can interoperate via Mosaic's data management and selection facilities.

## Why Mosaic?

Open source tools inspired by Wilkinson's Grammar of Graphics&mdash;including ggplot2, Vega, Vega-Lite, and Observable Plot&mdash;support an expressive range of visualizations, often with a concise, combinatorial syntax.
Vega and Vega-Lite further support declarative specification of interaction methods.
Vega-Lite's _selection_ abstraction combines input events and scale inversions to form query predicates over selected intervals or point values.
These selections are realized as non-standardized internal Vega constructs, complicating interoperation with non-Vega tools.

Moreover, these languages were not designed to handle millions of data points. For greater scale, VegaFusion and VegaPlus analyze Vega dataflows and push transformations to a database.
Still, many Vega transformations are not well supported.
Our benchmark results find that Mosaic provides greater scalability across a larger set of visualizations.
As these systems modify Vega internally, limitations around extensibility and interoperability also remain.

Mosaic instead provides an open middle-tier architecture that higher-level languages such as ggplot2, Vega-Lite, or Observable Plot could target.
Using a shared architecture, a visualization grammar could readily interoperate with other libraries, including input components and other visualization tools.
We demonstrate this through the design of [_vgplot_](/vgplot/), a Mosaic-based grammar of interactive graphics that combines concepts from these existing languages.

Mosaic offers scalability by proxying queries to a backing database, and supports interaction by standardizing and generalizing Vega-Lite-style _selections_.
Compared to Vega-Lite, Mosaic selections are decoupled from input event handling and support more complex resolution strategies.
A single Mosaic selection may combine predicates provided by a variety of diverse views and input techniques.
Mosaic selections can also synthesize different predicates for different views (clients), enabling complex coordination behaviors such as cross-filtering.