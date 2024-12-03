{
      "additionalProperties": false,
      "description": "A plot component.",
      "properties": {
        "align": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as:\n\n- 0 - use the start of the range, putting unused space at the end\n- 0.5 (default) - use the middle, distributing unused space evenly\n- 1 use the end, putting unused space at the start\n\nFor ordinal position scales only."
        },
        "aspectRatio": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "boolean"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired aspect ratio of the *x* and *y* scales, affecting the default height. Given an aspect ratio of *dx* / *dy*, and assuming that the *x* and\n*y* scales represent equivalent units (say, degrees Celsius or meters), computes a default height such that *dx* pixels along *x* represents the same variation as *dy* pixels along *y*. Note: when faceting, set the *fx* and *fy* scales’ **round** option to false for an exact aspect ratio."
        },
        "axis": {
          "anyOf": [
            {
              "const": "top",
              "type": "string"
            },
            {
              "const": "right",
              "type": "string"
            },
            {
              "const": "bottom",
              "type": "string"
            },
            {
              "const": "left",
              "type": "string"
            },
            {
              "const": "both",
              "type": "string"
            },
            {
              "type": "boolean"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The side of the frame on which to place the implicit axis: *top* or\n*bottom* for *x* or *fx*, or *left* or *right* for *y* or *fy*. The default depends on the scale:\n\n- *x* - *bottom*\n- *y* - *left*\n- *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom*\n- *fy* - *right* if there is a *left* *y* axis, and otherwise *right*\n\nIf *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *x* or *fx*, or *left* and *right* for *y* or\n*fy*). If null, the implicit axis is suppressed.\n\nFor position axes only."
        },
        "colorBase": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* and *diverging-log* scales only."
        },
        "colorClamp": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum.\n\nClamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain.\n\nFor continuous scales only."
        },
        "colorConstant": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* and *diverging-symlog* scales only."
        },
        "colorDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order."
        },
        "colorExponent": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* and *diverging-pow* scales only."
        },
        "colorInterpolate": {
          "anyOf": [
            {
              "$ref": "#/definitions/Interpolate"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to interpolate color range values. For quantitative scales only. This attribute can be used to specify a color space for interpolating colors specified in the **colorRange**."
        },
        "colorLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.\n\nFor axes and legends only."
        },
        "colorN": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *quantile* scale, the number of quantiles (creates *n* - 1 thresholds); for a *quantize* scale, the approximate number of thresholds; defaults to 5."
        },
        "colorNice": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as\n*minute*, *wednesday* or *month* to specify what constitutes a nice interval.\n\nFor continuous scales only."
        },
        "colorPercent": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]."
        },
        "colorPivot": {
          "anyOf": [
            {},
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a diverging color scale, the input value (abstract value) that divides the domain into two parts; defaults to 0 for *diverging* scales, dividing the domain into negative and positive parts; defaults to 1 for\n*diverging-log* scales. By default, diverging scales are symmetric around the pivot; see the **symmetric** option."
        },
        "colorRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**. For other ordinal data, it is an array (or iterable) of output values in the same order as the **domain**."
        },
        "colorReverse": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to reverse the scale’s encoding; equivalent to reversing either the\n**domain** or **range**."
        },
        "colorScale": {
          "anyOf": [
            {
              "$ref": "#/definitions/ColorScaleType"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The *color* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled.\n\nFor quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, *categorical* for color scales, and otherwise *ordinal*."
        },
        "colorScheme": {
          "anyOf": [
            {
              "$ref": "#/definitions/ColorScheme"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If specified, shorthand for setting the **colorRange** or **colorInterpolate** option of a *color* scale."
        },
        "colorSymmetric": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a diverging color scale, if true (the default), extend the domain to ensure that the lower part of the domain (below the **pivot**) is commensurate with the upper part of the domain (above the **pivot**).\n\nA symmetric diverging color scale may not use all of its output **range**; this reduces contrast but ensures that deviations both below and above the\n**pivot** are represented proportionally. Otherwise if false, the full output **range** will be used; this increases contrast but values on opposite sides of the **pivot** may not be meaningfully compared."
        },
        "colorTickFormat": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to format inputs (abstract values) for axis tick labels; one of:\n\n- a [d3-format][1] string for numeric scales\n- a [d3-time-format][2] string for temporal scales\n\n[1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format"
        },
        "colorZero": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero.\n\nFor quantitative scales only."
        },
        "facetGrid": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Default axis grid for fx and fy scales; typically set to true to enable."
        },
        "facetLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Default axis label for fx and fy scales; typically set to null to disable."
        },
        "facetMargin": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four facet margins: marginTop, marginRight, marginBottom, and marginLeft."
        },
        "facetMarginBottom": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The right facet margin; the (minimum) distance in pixels between the right edges of the inner and outer plot area."
        },
        "facetMarginLeft": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The bottom facet margin; the (minimum) distance in pixels between the bottom edges of the inner and outer plot area."
        },
        "facetMarginRight": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The left facet margin; the (minimum) distance in pixels between the left edges of the inner and outer plot area."
        },
        "facetMarginTop": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The top facet margin; the (minimum) distance in pixels between the top edges of the inner and outer plot area."
        },
        "fxAlign": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as:\n\n- 0 - use the start of the range, putting unused space at the end\n- 0.5 (default) - use the middle, distributing unused space evenly\n- 1 use the end, putting unused space at the start\n\nFor ordinal position scales only."
        },
        "fxAriaDescription": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual description for the axis in the accessibility tree."
        },
        "fxAriaLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A short label representing the axis in the accessibility tree."
        },
        "fxAxis": {
          "anyOf": [
            {
              "const": "top",
              "type": "string"
            },
            {
              "const": "bottom",
              "type": "string"
            },
            {
              "const": "both",
              "type": "string"
            },
            {
              "type": "boolean"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The side of the frame on which to place the implicit axis: *top* or\n*bottom* for *fx*. Defaults to *top* if there is a *bottom* *x* axis, and otherwise *bottom*.\n\nIf *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *fx*). If null, the implicit axis is suppressed."
        },
        "fxDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order."
        },
        "fxFontVariant": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."
        },
        "fxGrid": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark.\n\nFor axes only."
        },
        "fxInset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four insets: **insetTop**,\n**insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it."
        },
        "fxInsetLeft": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it)."
        },
        "fxInsetRight": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it)."
        },
        "fxLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.\n\nFor axes and legends only."
        },
        "fxLabelAnchor": {
          "anyOf": [
            {
              "const": "top",
              "type": "string"
            },
            {
              "const": "right",
              "type": "string"
            },
            {
              "const": "bottom",
              "type": "string"
            },
            {
              "const": "left",
              "type": "string"
            },
            {
              "const": "center",
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or\n*center*; for horizontal position scales (*x* and *fx*), may be *left*,\n*right*, or *center*. Defaults to *center* for ordinal scales (including\n*fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*."
        },
        "fxLabelOffset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The axis **label** position offset (in pixels); default depends on margins and orientation."
        },
        "fxLine": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, draw a line along the axis; if false (default), do not."
        },
        "fxPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%).\n\nFor ordinal position scales only."
        },
        "fxPaddingInner": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to separate adjacent bands."
        },
        "fxPaddingOuter": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to inset first and last bands."
        },
        "fxRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale."
        },
        "fxReverse": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to reverse the scale’s encoding; equivalent to reversing either the\n**domain** or **range**."
        },
        "fxRound": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering.\n\nFor position scales only."
        },
        "fxTickFormat": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to format inputs (abstract values) for axis tick labels; one of:\n\n- a [d3-format][1] string for numeric scales\n- a [d3-time-format][2] string for temporal scales\n\n[1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format"
        },
        "fxTickPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fxTickSize** and\n**fxTickRotate**."
        },
        "fxTickRotate": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The rotation angle of axis tick labels in degrees clocksize; defaults to 0."
        },
        "fxTickSize": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and\n*opacity* *ramp* legends, and 0 for *fx* and *fy* axes."
        },
        "fxTickSpacing": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."
        },
        "fxTicks": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."
        },
        "fyAlign": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as:\n\n- 0 - use the start of the range, putting unused space at the end\n- 0.5 (default) - use the middle, distributing unused space evenly\n- 1 use the end, putting unused space at the start\n\nFor ordinal position scales only."
        },
        "fyAriaDescription": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual description for the axis in the accessibility tree."
        },
        "fyAriaLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A short label representing the axis in the accessibility tree."
        },
        "fyAxis": {
          "anyOf": [
            {
              "const": "left",
              "type": "string"
            },
            {
              "const": "right",
              "type": "string"
            },
            {
              "const": "both",
              "type": "string"
            },
            {
              "type": "boolean"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The side of the frame on which to place the implicit axis: *left* or\n*right* for *fy*. Defaults to *left* for an *fy* scale.\n\nIf *both*, an implicit axis will be rendered on both sides of the plot (*left* and *right* for *fy*). If null, the implicit axis is suppressed."
        },
        "fyDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order."
        },
        "fyFontVariant": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."
        },
        "fyGrid": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark.\n\nFor axes only."
        },
        "fyInset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four insets: **insetTop**,\n**insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it."
        },
        "fyInsetBottom": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it)."
        },
        "fyInsetTop": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it)."
        },
        "fyLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.\n\nFor axes and legends only."
        },
        "fyLabelAnchor": {
          "anyOf": [
            {
              "const": "top",
              "type": "string"
            },
            {
              "const": "right",
              "type": "string"
            },
            {
              "const": "bottom",
              "type": "string"
            },
            {
              "const": "left",
              "type": "string"
            },
            {
              "const": "center",
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or\n*center*; for horizontal position scales (*x* and *fx*), may be *left*,\n*right*, or *center*. Defaults to *center* for ordinal scales (including\n*fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*."
        },
        "fyLabelOffset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The axis **label** position offset (in pixels); default depends on margins and orientation."
        },
        "fyLine": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, draw a line along the axis; if false (default), do not."
        },
        "fyPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%).\n\nFor ordinal position scales only."
        },
        "fyPaddingInner": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to separate adjacent bands."
        },
        "fyPaddingOuter": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to inset first and last bands."
        },
        "fyRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale."
        },
        "fyReverse": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to reverse the scale’s encoding; equivalent to reversing either the\n**domain** or **range**."
        },
        "fyRound": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering.\n\nFor position scales only."
        },
        "fyTickFormat": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to format inputs (abstract values) for axis tick labels; one of:\n\n- a [d3-format][1] string for numeric scales\n- a [d3-time-format][2] string for temporal scales\n\n[1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format"
        },
        "fyTickPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fyTickSize** and\n**fyTickRotate**."
        },
        "fyTickRotate": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The rotation angle of axis tick labels in degrees clocksize; defaults to 0."
        },
        "fyTickSize": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and\n*opacity* *ramp* legends, and 0 for *fx* and *fy* axes."
        },
        "fyTickSpacing": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."
        },
        "fyTicks": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."
        },
        "grid": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark.\n\nFor axes only."
        },
        "height": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The outer height of the plot in pixels, including margins. The default depends on the plot’s scales, and the plot’s width if an aspectRatio is specified. For example, if the *y* scale is linear and there is no *fy* scale, it might be 396."
        },
        "inset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four insets: **insetTop**,\n**insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it."
        },
        "label": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.\n\nFor axes and legends only."
        },
        "lengthBase": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only."
        },
        "lengthClamp": {
          "description": "If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum.\n\nClamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain.\n\nFor continuous scales only."
        },
        "lengthConstant": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only."
        },
        "lengthDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order.\n\nLinear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. Radius scales have a default domain from 0 to the median first quartile of associated channels. Length have a default domain from 0 to the median median of associated channels. Opacity scales have a default domain from 0 to the maximum value of associated channels."
        },
        "lengthExponent": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only."
        },
        "lengthNice": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as\n*minute*, *wednesday* or *month* to specify what constitutes a nice interval.\n\nFor continuous scales only."
        },
        "lengthPercent": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]."
        },
        "lengthRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**.\n\nLength scales have a default range of [0, 12]."
        },
        "lengthScale": {
          "anyOf": [
            {
              "$ref": "#/definitions/ContinuousScaleType"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The *length* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The length scale defaults to *linear*, as this scale is intended for quantitative data."
        },
        "lengthZero": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero.\n\nFor quantitative scales only."
        },
        "margin": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four margins: **marginTop**,\n**marginRight**, **marginBottom**, and **marginLeft**. Otherwise, the default margins depend on the maximum margins of the plot’s marks. While most marks default to zero margins (because they are drawn inside the chart area), Plot’s axis marks have non-zero default margins."
        },
        "marginBottom": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The bottom margin; the distance in pixels between the bottom edges of the inner and outer plot area. Defaults to the maximum bottom margin of the plot’s marks."
        },
        "marginLeft": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The left margin; the distance in pixels between the left edges of the inner and outer plot area. Defaults to the maximum left margin of the plot’s marks."
        },
        "marginRight": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The right margin; the distance in pixels between the right edges of the inner and outer plot area. Defaults to the maximum right margin of the plot’s marks."
        },
        "marginTop": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The top margin; the distance in pixels between the top edges of the inner and outer plot area. Defaults to the maximum top margin of the plot’s marks."
        },
        "margins": {
          "additionalProperties": false,
          "description": "A shorthand object notation for setting multiple margin values. The object keys are margin names (top, right, etc).",
          "properties": {
            "bottom": {
              "anyOf": [
                {
                  "type": "number"
                },
                {
                  "$ref": "#/definitions/ParamRef"
                }
              ]
            },
            "left": {
              "anyOf": [
                {
                  "type": "number"
                },
                {
                  "$ref": "#/definitions/ParamRef"
                }
              ]
            },
            "right": {
              "anyOf": [
                {
                  "type": "number"
                },
                {
                  "$ref": "#/definitions/ParamRef"
                }
              ]
            },
            "top": {
              "anyOf": [
                {
                  "type": "number"
                },
                {
                  "$ref": "#/definitions/ParamRef"
                }
              ]
            }
          },
          "type": "object"
        },
        "name": {
          "description": "A unique name for the plot. The name is used by standalone legend components to to lookup the plot and access scale mappings.",
          "type": "string"
        },
        "opacityBase": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only."
        },
        "opacityClamp": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum.\n\nClamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain.\n\nFor continuous scales only."
        },
        "opacityConstant": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only."
        },
        "opacityDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order.\n\nOpacity scales have a default domain from 0 to the maximum value of associated channels."
        },
        "opacityExponent": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only."
        },
        "opacityLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.\n\nFor axes and legends only."
        },
        "opacityNice": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as\n*minute*, *wednesday* or *month* to specify what constitutes a nice interval.\n\nFor continuous scales only."
        },
        "opacityPercent": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]."
        },
        "opacityRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values).\n\nOpacity scales have a default range of [0, 1]."
        },
        "opacityReverse": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to reverse the scale’s encoding; equivalent to reversing either the\n**domain** or **range**."
        },
        "opacityScale": {
          "anyOf": [
            {
              "$ref": "#/definitions/ContinuousScaleType"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The *opacity* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The opacity scale defaults to *linear*; this scales is intended for quantitative data."
        },
        "opacityTickFormat": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to format inputs (abstract values) for axis tick labels; one of:\n\n- a [d3-format][1] string for numeric scales\n- a [d3-time-format][2] string for temporal scales\n\n[1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format"
        },
        "opacityZero": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero.\n\nFor quantitative scales only."
        },
        "padding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%).\n\nFor ordinal position scales only."
        },
        "plot": {
          "description": "An array of plot marks, interactors, or legends. Marks are graphical elements that make up plot layers. Unless otherwise configured, interactors will use the nearest previous mark as a basis for which data fields to select.",
          "items": {
            "anyOf": [
              {
                "$ref": "#/definitions/PlotMark"
              },
              {
                "$ref": "#/definitions/PlotInteractor"
              },
              {
                "$ref": "#/definitions/PlotLegend"
              }
            ]
          },
          "type": "array"
        },
        "projectionClip": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "number"
            },
            {
              "const": "frame",
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The projection’s clipping method; one of:\n\n- *frame* or true (default) - clip to the plot’s frame (including margins but not insets)\n- a number - clip to a circle of the given radius in degrees centered around the origin\n- null or false - do not clip\n\nSome projections (such as [*armadillo*][1] and [*berghaus*][2]) require spherical clipping: in that case set the marks’ **clip** option to\n*sphere*.\n\n[1]: https://observablehq.com/@d3/armadillo [2]: https://observablehq.com/@d3/berghaus-star"
        },
        "projectionDomain": {
          "anyOf": [
            {
              "type": "object"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A GeoJSON object to fit to the plot’s frame (minus insets); defaults to a Sphere for spherical projections (outline of the the whole globe)."
        },
        "projectionInset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four projection insets. All insets typically default to zero, though not always. A positive inset reduces effective area, while a negative inset increases it."
        },
        "projectionInsetBottom": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the bottom edge of the projection by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it)."
        },
        "projectionInsetLeft": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the left edge of the projection by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it)."
        },
        "projectionInsetRight": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the right edge of the projection by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it)."
        },
        "projectionInsetTop": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the top edge of the projection by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it)."
        },
        "projectionParallels": {
          "anyOf": [
            {
              "items": [
                {
                  "anyOf": [
                    {
                      "type": "number"
                    },
                    {
                      "$ref": "#/definitions/ParamRef"
                    }
                  ],
                  "title": "y1"
                },
                {
                  "anyOf": [
                    {
                      "type": "number"
                    },
                    {
                      "$ref": "#/definitions/ParamRef"
                    }
                  ],
                  "title": "y2"
                }
              ],
              "maxItems": 2,
              "minItems": 2,
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The [standard parallels][1]. For conic projections only.\n\n[1]: https://d3js.org/d3-geo/conic#conic_parallels"
        },
        "projectionPrecision": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The projection’s [sampling threshold][1].\n\n[1]: https://d3js.org/d3-geo/projection#projection_precision"
        },
        "projectionRotate": {
          "anyOf": [
            {
              "items": [
                {
                  "anyOf": [
                    {
                      "type": "number"
                    },
                    {
                      "$ref": "#/definitions/ParamRef"
                    }
                  ],
                  "title": "x"
                },
                {
                  "anyOf": [
                    {
                      "type": "number"
                    },
                    {
                      "$ref": "#/definitions/ParamRef"
                    }
                  ],
                  "title": "y"
                },
                {
                  "anyOf": [
                    {
                      "type": "number"
                    },
                    {
                      "$ref": "#/definitions/ParamRef"
                    }
                  ],
                  "title": "z"
                }
              ],
              "maxItems": 3,
              "minItems": 3,
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A rotation of the sphere before projection; defaults to [0, 0, 0]. Specified as Euler angles λ (yaw, or reference longitude), φ (pitch, or reference latitude), and optionally γ (roll), in degrees."
        },
        "projectionType": {
          "anyOf": [
            {
              "$ref": "#/definitions/ProjectionName"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired projection; one of:\n\n- a named built-in projection such as *albers-usa*\n- null, for no projection\n\nNamed projections are scaled and translated to fit the **domain** to the plot’s frame (minus insets)."
        },
        "rBase": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only."
        },
        "rClamp": {
          "description": "If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum.\n\nClamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain.\n\nFor continuous scales only."
        },
        "rConstant": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only."
        },
        "rDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order.\n\nRadius scales have a default domain from 0 to the median first quartile of associated channels."
        },
        "rExponent": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only."
        },
        "rLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value."
        },
        "rNice": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as\n*minute*, *wednesday* or *month* to specify what constitutes a nice interval.\n\nFor continuous scales only."
        },
        "rPercent": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]."
        },
        "rRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**.\n\nRadius scales have a default range of [0, 3]."
        },
        "rScale": {
          "anyOf": [
            {
              "$ref": "#/definitions/ContinuousScaleType"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The *r* (radius) scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The radius scale defaults to *sqrt*; this scale is intended for quantitative data."
        },
        "rZero": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero.\n\nFor quantitative scales only."
        },
        "style": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/CSSStyles"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Custom styles to override Plot’s defaults. Styles may be specified either as a string of inline styles (*e.g.*, `\"color: red;\"`, in the same fashion as assigning [*element*.style][1]) or an object of properties (*e.g.*, `{color: \"red\"}`, in the same fashion as assigning [*element*.style properties][2]). Note that unitless numbers ([quirky lengths][3]) such as `{padding: 20}` may not supported by some browsers; you should instead specify a string with units such as `{padding: \"20px\"}`. By default, the returned plot has a max-width of 100%, and the system-ui font. Plot’s marks and axes default to [currentColor][4], meaning that they will inherit the surrounding content’s color.\n\n[1]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style [2]: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration [3]: https://www.w3.org/TR/css-values-4/#deprecated-quirky-length [4]: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword"
        },
        "symbolDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. As symbol scales are discrete, the domain is an array (or iterable) of values is the desired order, defaulting to natural ascending order."
        },
        "symbolRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**.\n\nSymbol scales have a default range of categorical symbols; the choice of symbols depends on whether the associated dot mark is filled or stroked."
        },
        "symbolScale": {
          "anyOf": [
            {
              "$ref": "#/definitions/DiscreteScaleType"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The *symbol* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. Defaults to an *ordinal* scale type."
        },
        "width": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The outer width of the plot in pixels, including margins. Defaults to 640. On Observable, this can be set to the built-in [width][1] for full-width responsive plots. Note: the default style has a max-width of 100%; the plot will automatically shrink to fit even when a fixed width is specified.\n\n[1]: https://github.com/observablehq/stdlib/blob/main/README.md#width"
        },
        "xAlign": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as:\n\n- 0 - use the start of the range, putting unused space at the end\n- 0.5 (default) - use the middle, distributing unused space evenly\n- 1 use the end, putting unused space at the start\n\nFor ordinal position scales only."
        },
        "xAriaDescription": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual description for the axis in the accessibility tree."
        },
        "xAriaLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A short label representing the axis in the accessibility tree."
        },
        "xAxis": {
          "anyOf": [
            {
              "const": "top",
              "type": "string"
            },
            {
              "const": "bottom",
              "type": "string"
            },
            {
              "const": "both",
              "type": "string"
            },
            {
              "type": "boolean"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The side of the frame on which to place the implicit axis: *top* or\n*bottom* for *x*. Defaults to *bottom* for an *x* scale.\n\nIf *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *x*). If null, the implicit axis is suppressed."
        },
        "xBase": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only."
        },
        "xClamp": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum.\n\nClamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain.\n\nFor continuous scales only."
        },
        "xConstant": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only."
        },
        "xDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order.\n\nLinear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. Radius scales have a default domain from 0 to the median first quartile of associated channels. Length have a default domain from 0 to the median median of associated channels. Opacity scales have a default domain from 0 to the maximum value of associated channels."
        },
        "xExponent": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only."
        },
        "xFontVariant": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."
        },
        "xGrid": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark.\n\nFor axes only."
        },
        "xInset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four insets: **insetTop**,\n**insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it."
        },
        "xInsetLeft": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it)."
        },
        "xInsetRight": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it)."
        },
        "xLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.\n\nFor axes and legends only."
        },
        "xLabelAnchor": {
          "anyOf": [
            {
              "const": "top",
              "type": "string"
            },
            {
              "const": "right",
              "type": "string"
            },
            {
              "const": "bottom",
              "type": "string"
            },
            {
              "const": "left",
              "type": "string"
            },
            {
              "const": "center",
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or\n*center*; for horizontal position scales (*x* and *fx*), may be *left*,\n*right*, or *center*. Defaults to *center* for ordinal scales (including\n*fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*."
        },
        "xLabelArrow": {
          "anyOf": [
            {
              "$ref": "#/definitions/LabelArrow"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to apply a directional arrow such as → or ↑ to the x-axis scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal."
        },
        "xLabelOffset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The axis **label** position offset (in pixels); default depends on margins and orientation."
        },
        "xLine": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, draw a line along the axis; if false (default), do not."
        },
        "xNice": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as\n*minute*, *wednesday* or *month* to specify what constitutes a nice interval.\n\nFor continuous scales only."
        },
        "xPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%).\n\nFor ordinal position scales only."
        },
        "xPaddingInner": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to separate adjacent bands."
        },
        "xPaddingOuter": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to inset first and last bands."
        },
        "xPercent": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]."
        },
        "xRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale."
        },
        "xReverse": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to reverse the scale’s encoding; equivalent to reversing either the\n**domain** or **range**."
        },
        "xRound": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering.\n\nFor position scales only."
        },
        "xScale": {
          "anyOf": [
            {
              "$ref": "#/definitions/PositionScaleType"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The *x* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled.\n\nFor quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, *categorical* for color scales, and otherwise *ordinal*. However, the radius scale defaults to *sqrt*, and the length and opacity scales default to *linear*; these scales are intended for quantitative data. The plot’s marks may also impose a scale type; for example, the barY mark requires that *x* is a *band* scale."
        },
        "xTickFormat": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to format inputs (abstract values) for axis tick labels; one of:\n\n- a [d3-format][1] string for numeric scales\n- a [d3-time-format][2] string for temporal scales\n\n[1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format"
        },
        "xTickPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and\n**xTickRotate**."
        },
        "xTickRotate": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The rotation angle of axis tick labels in degrees clocksize; defaults to 0."
        },
        "xTickSize": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and\n*opacity* *ramp* legends, and 0 for *fx* and *fy* axes."
        },
        "xTickSpacing": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."
        },
        "xTicks": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."
        },
        "xZero": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero.\n\nFor quantitative scales only."
        },
        "xyDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Set the *x* and *y* scale domains."
        },
        "yAlign": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as:\n\n- 0 - use the start of the range, putting unused space at the end\n- 0.5 (default) - use the middle, distributing unused space evenly\n- 1 use the end, putting unused space at the start\n\nFor ordinal position scales only."
        },
        "yAriaDescription": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual description for the axis in the accessibility tree."
        },
        "yAriaLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A short label representing the axis in the accessibility tree."
        },
        "yAxis": {
          "anyOf": [
            {
              "const": "left",
              "type": "string"
            },
            {
              "const": "right",
              "type": "string"
            },
            {
              "const": "both",
              "type": "string"
            },
            {
              "type": "boolean"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The side of the frame on which to place the implicit axis: *left* or\n*right* for *y*. Defaults to *left* for a *y* scale.\n\nIf *both*, an implicit axis will be rendered on both sides of the plot (*left* and *right* for *y*). If null, the implicit axis is suppressed."
        },
        "yBase": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only."
        },
        "yClamp": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum.\n\nClamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain.\n\nFor continuous scales only."
        },
        "yConstant": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only."
        },
        "yDomain": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order.\n\nLinear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero."
        },
        "yExponent": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only."
        },
        "yFontVariant": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."
        },
        "yGrid": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "string"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark.\n\nFor axes only."
        },
        "yInset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Shorthand to set the same default for all four insets: **insetTop**,\n**insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it."
        },
        "yInsetBottom": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it)."
        },
        "yInsetTop": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it)."
        },
        "yLabel": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.\n\nFor axes and legends only."
        },
        "yLabelAnchor": {
          "anyOf": [
            {
              "const": "top",
              "type": "string"
            },
            {
              "const": "right",
              "type": "string"
            },
            {
              "const": "bottom",
              "type": "string"
            },
            {
              "const": "left",
              "type": "string"
            },
            {
              "const": "center",
              "type": "string"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or\n*center*; for horizontal position scales (*x* and *fx*), may be *left*,\n*right*, or *center*. Defaults to *center* for ordinal scales (including\n*fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*."
        },
        "yLabelArrow": {
          "anyOf": [
            {
              "$ref": "#/definitions/LabelArrow"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to apply a directional arrow such as → or ↑ to the x-axis scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal."
        },
        "yLabelOffset": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The axis **label** position offset (in pixels); default depends on margins and orientation."
        },
        "yLine": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, draw a line along the axis; if false (default), do not."
        },
        "yNice": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as\n*minute*, *wednesday* or *month* to specify what constitutes a nice interval.\n\nFor continuous scales only."
        },
        "yPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%).\n\nFor ordinal position scales only."
        },
        "yPaddingInner": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to separate adjacent bands."
        },
        "yPaddingOuter": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "For a *band* scale, how much of the range to reserve to inset first and last bands."
        },
        "yPercent": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]."
        },
        "yRange": {
          "anyOf": [
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/Fixed"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*,\n*max*]; it can be [*max*, *min*] to reverse the scale."
        },
        "yReverse": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether to reverse the scale’s encoding; equivalent to reversing either the\n**domain** or **range**. Note that by default, when the *y* scale is continuous, the *max* value points to the top of the screen, whereas ordinal values are ranked from top to bottom."
        },
        "yRound": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering.\n\nFor position scales only."
        },
        "yScale": {
          "anyOf": [
            {
              "$ref": "#/definitions/PositionScaleType"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The *y* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled.\n\nFor quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales,  The plot’s marks may also impose a scale type; for example, the barY mark requires that *x* is a *band* scale."
        },
        "yTickFormat": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "How to format inputs (abstract values) for axis tick labels; one of:\n\n- a [d3-format][1] string for numeric scales\n- a [d3-time-format][2] string for temporal scales\n\n[1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format"
        },
        "yTickPadding": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **yTickSize** and\n**yTickRotate**."
        },
        "yTickRotate": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The rotation angle of axis tick labels in degrees clocksize; defaults to 0."
        },
        "yTickSize": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and\n*opacity* *ramp* legends, and 0 for *fx* and *fy* axes."
        },
        "yTickSpacing": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."
        },
        "yTicks": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "$ref": "#/definitions/Interval"
            },
            {
              "items": {},
              "type": "array"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."
        },
        "yZero": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "$ref": "#/definitions/ParamRef"
            }
          ],
          "description": "Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero.\n\nFor quantitative scales only."
        }
      },
      "required": [
        "plot"
      ],
      "type": "object"
    }
