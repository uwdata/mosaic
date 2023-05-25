# Attributes

_Attributes_ are plot-level settings such as `width`, `height`, margins, and scale options (e.g., `xDomainX`, `colorRange`, `yTickFormat`). Attributes may be [Param](params)-valued, in which case a plot updates upon Param changes.

vgplot includes a special `Fixed` scale domain setting (e.g., `xDomain(Fixed)`), which instructs a plot to first calculate a scale domain in a data-driven manner, but then keep that domain fixed across subsequent updates.
Fixed domains enable stable configurations without requiring a hard-wired domain to be known in advance, preventing disorienting scale domain "jumps" that hamper comparison across filter interactions (a current limitation of Vega-Lite).
