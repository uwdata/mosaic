# Plots

A vgplot `plot` produces a single visualization as a Web element.

Similar to other grammars, a `plot` consists of _marks_&mdash;graphical primitives such as bars, areas, and lines&mdash;which serve as chart layers.
We use the semantics of Observable Plot, such that each `plot` has a dedicated set of encodings with named _scale_ mappings such as `x`, `y`, `color`, `opacity`, etc.
Plots support faceting of the `x` and `y` dimensions, producing associated `fx` and `fy` scales.
Plots are rendered to SVG output by marshalling a specification and passing it to Observable Plot.

A `plot` is defined as a list of directives defining plot [attributes](attributes), [marks](marks), [interactors](interactors), or [legends](legends).
