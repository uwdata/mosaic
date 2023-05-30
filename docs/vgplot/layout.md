# Layout

Layout helpers combine elements such as [plots](plots) and [input widgets](inputs) into multi-view dashboard displays.
vgplot includes `vconcat` (vertical concatenation) and `hconcat` (horizontal concatenation) methods for multi-view layout.
These methods accept a list of elements and position them using CSS `flexbox` layout.
Layout helpers can be used with plots, inputs, and arbitrary Web content such as images and videos.
To ensure spacing, the `vspace` and `hspace` helpers add padding between elements in a layout.

## vconcat(...elements)

Vertically layout the provided elements in a column.

The input _elements_ should be valid HTML elements.

## hconcat(...elements)

Horizontally layout the provided elements in a row.

The input _elements_ should be valid HTML elements.

## hspace(value)

Add horizontal space between elements.

If _value_ is a number it is interpreted as a pixel value,
otherwise it should be a valid [CSS length unit](https://developer.mozilla.org/en-US/docs/Web/CSS/length).

## vspace(value)

Add vertical space between elements.

If _value_ is a number it is interpreted as a pixel value,
otherwise it should be a valid [CSS length unit](https://developer.mozilla.org/en-US/docs/Web/CSS/length).
