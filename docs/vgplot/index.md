# vgplot: An Interactive Grammar of Graphics

_vgplot_ is a grammar of interactive graphics in which graphical marks are Mosaic clients.
The "vg" in vgplot stands for "visualization grammar".
As its name suggests, vgplot combines concepts from existing tools such as Vega-Lite, ggplot2, and Observable Plot.

Like Vega-Lite, vgplot supports rich interactions and declarative specification either using an API or standalone JSON/YAML specs.
However, because vgplot is based on Mosaic, it easily interoperates with other Mosaic clients, such as [Mosaic input widgets](inputs).
Charts in vgplot are specified as a flat list of _directives_, inspired by the syntax of both ggplot2 and our prior work on Dziban.
vgplot adopts Observable Plot's chart semantics, which incorporates ideas from both Vega-Lite and ggplot2.
Internally, vgplot uses Observable Plot, which in turn  uses D3, to perform SVG rendering.
