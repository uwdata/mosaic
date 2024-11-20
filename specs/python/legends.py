from mosaic_spec import *
from typing import Dict, Any, Union

spec = {
  "meta": {
    "title": "Legends",
    "description": "Tests for different legend types and configurations. We test both legends defined within plots (with a zero-size frame) and external legends that reference a named plot.\n"
  },
  "params": {
    "toggle": {
      "select": "single"
    },
    "interval": {
      "select": "intersect"
    },
    "domain": [
      "foo",
      "bar",
      "baz",
      "bop",
      "doh"
    ]
  },
  "plotDefaults": {
    "margin": 0,
    "width": 0,
    "height": 20
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color",
              "label": "Color Swatch",
              "as": "$toggle"
            }
          ],
          "name": "color-categorical",
          "colorScale": "categorical",
          "colorDomain": "$domain"
        },
        {
          "hspace": 35
        },
        {
          "legend": "color",
          "for": "color-categorical",
          "label": "Color Swatch (External)",
          "as": "$toggle"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "symbol",
              "label": "Symbol Swatch",
              "as": "$toggle"
            }
          ],
          "name": "symbol-categorical",
          "symbolDomain": "$domain"
        },
        {
          "hspace": 35
        },
        {
          "legend": "symbol",
          "for": "symbol-categorical",
          "label": "Symbol Swatch (External)",
          "as": "$toggle"
        }
      ]
    },
    {
      "vspace": "1em"
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "opacity",
              "label": "Opacity Ramp",
              "as": "$interval"
            }
          ],
          "name": "opacity-linear",
          "opacityDomain": [
            0,
            100
          ]
        },
        {
          "hspace": 30
        },
        {
          "legend": "opacity",
          "for": "opacity-linear",
          "label": "Opacity Ramp (External)",
          "as": "$interval"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "opacity"
            }
          ],
          "name": "opacity-linear-no-label",
          "opacityDomain": [
            0,
            100
          ]
        },
        {
          "hspace": 30
        },
        {
          "legend": "opacity",
          "for": "opacity-linear-no-label"
        }
      ]
    },
    {
      "vspace": "1em"
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color",
              "label": "Linear Color Ramp",
              "as": "$interval"
            }
          ],
          "name": "color-linear",
          "colorDomain": [
            0,
            100
          ]
        },
        {
          "hspace": 30
        },
        {
          "legend": "color",
          "for": "color-linear",
          "label": "Linear Color Ramp (External)",
          "as": "$interval"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color"
            }
          ],
          "name": "color-linear-no-label",
          "colorDomain": [
            0,
            100
          ]
        },
        {
          "hspace": 30
        },
        {
          "legend": "color",
          "for": "color-linear-no-label"
        }
      ]
    },
    {
      "vspace": "1em"
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color",
              "label": "Logarithmic Color Ramp",
              "as": "$interval"
            }
          ],
          "name": "color-log",
          "colorScale": "log",
          "colorDomain": [
            1,
            100
          ]
        },
        {
          "hspace": 30
        },
        {
          "legend": "color",
          "for": "color-log",
          "label": "Logarithmic Color Ramp (External)",
          "as": "$interval"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color",
              "label": "Diverging Color Ramp",
              "as": "$interval"
            }
          ],
          "name": "color-diverging",
          "colorScale": "diverging",
          "colorDomain": [
            -100,
            100
          ],
          "colorConstant": 20
        },
        {
          "hspace": 30
        },
        {
          "legend": "color",
          "for": "color-diverging",
          "label": "Diverging Color Ramp (External)",
          "as": "$interval"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color",
              "label": "Diverging Symlog Color Ramp",
              "as": "$interval"
            }
          ],
          "name": "color-diverging-symlog",
          "colorScale": "diverging-symlog",
          "colorDomain": [
            -100,
            100
          ],
          "colorConstant": 20
        },
        {
          "hspace": 30
        },
        {
          "legend": "color",
          "for": "color-diverging-symlog",
          "label": "Diverging Symlog Color Ramp (External)",
          "as": "$interval"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color",
              "label": "Quantize Color Ramp"
            }
          ],
          "name": "color-quantize",
          "colorScale": "quantize",
          "colorDomain": [
            0,
            100
          ]
        },
        {
          "hspace": 30
        },
        {
          "legend": "color",
          "for": "color-quantize",
          "label": "Quantize Color Ramp (External)"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "legend": "color",
              "label": "Threshold Color Ramp"
            }
          ],
          "name": "color-threshold",
          "colorScale": "threshold",
          "colorDomain": [
            0,
            10,
            20,
            40,
            80
          ]
        },
        {
          "hspace": 30
        },
        {
          "legend": "color",
          "for": "color-threshold",
          "label": "Threshold Color Ramp (External)"
        }
      ]
    }
  ]
}
