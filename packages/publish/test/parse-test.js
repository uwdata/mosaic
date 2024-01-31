import assert from 'node:assert';
import { parseSpec } from '../src/index.js';

const athletesSpec = {
  "meta": {
    "title": "Olympic Athletes",
    "description": "An interactive dashboard of athlete statistics. The input menus and searchbox filter the display and are automatically populated by backing data columns.\n"
  },
  "data": {
    "athletes": {
      "file": "data/athletes.parquet"
    }
  },
  "hconcat": [
    {
      "vconcat": [
        {
          "hconcat": [
            {
              "input": "menu",
              "label": "Sport",
              "as": "$query",
              "from": "athletes",
              "column": "sport"
            },
            {
              "input": "menu",
              "label": "Sex",
              "as": "$query",
              "from": "athletes",
              "column": "sex"
            },
            {
              "input": "search",
              "label": "Name",
              "as": "$query",
              "from": "athletes",
              "column": "name",
              "type": "contains"
            }
          ]
        },
        {
          "vspace": 10
        },
        {
          "plot": [
            {
              "mark": "dot",
              "data": {
                "from": "athletes",
                "filterBy": "$query"
              },
              "x": "weight",
              "y": "height",
              "fill": "sex",
              "r": 2,
              "opacity": 0.1
            },
            {
              "mark": "regressionY",
              "data": {
                "from": "athletes",
                "filterBy": "$query"
              },
              "x": "weight",
              "y": "height",
              "stroke": "sex"
            },
            {
              "select": "intervalXY",
              "as": "$query",
              "brush": {
                "fillOpacity": 0,
                "stroke": "black"
              }
            }
          ],
          "xyDomain": "Fixed",
          "colorDomain": "Fixed",
          "margins": {
            "left": 35,
            "top": 20,
            "right": 1
          },
          "width": 570,
          "height": 350
        },
        {
          "vspace": 5
        },
        {
          "input": "table",
          "from": "athletes",
          "maxWidth": 570,
          "height": 250,
          "filterBy": "$query",
          "columns": [
            "name",
            "nationality",
            "sex",
            "height",
            "weight",
            "sport"
          ],
          "width": {
            "name": 180,
            "nationality": 100,
            "sex": 50,
            "height": 50,
            "weight": 50,
            "sport": 100
          }
        }
      ]
    }
  ]
};

const marksSpec = {
  "meta": {
    "title": "Mark Types",
    "description": "A subset of supported mark types.\n\n- Row 1: `barY`, `lineY`, `text`, `tickY`, `areaY`\n- Row 2: `regressionY`, `hexbin`, `contour`, `raster`, `denseLine`\n"
  },
  "data": {
    "md": [
      {
        "i": 0,
        "u": "A",
        "v": 2
      },
      {
        "i": 1,
        "u": "B",
        "v": 8
      },
      {
        "i": 2,
        "u": "C",
        "v": 3
      },
      {
        "i": 3,
        "u": "D",
        "v": 7
      },
      {
        "i": 4,
        "u": "E",
        "v": 5
      },
      {
        "i": 5,
        "u": "F",
        "v": 4
      },
      {
        "i": 6,
        "u": "G",
        "v": 6
      },
      {
        "i": 7,
        "u": "H",
        "v": 1
      }
    ]
  },
  "plotDefaults": {
    "xAxis": null,
    "yAxis": null,
    "margins": {
      "left": 5,
      "top": 5,
      "right": 5,
      "bottom": 5
    },
    "width": 160,
    "height": 100,
    "yDomain": [
      0,
      9
    ]
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "mark": "barY",
          "data": {
            "from": "md"
          },
          "x": "u",
          "y": "v",
          "fill": "steelblue"
        },
        {
          "mark": "lineY",
          "data": {
            "from": "md"
          },
          "x": "u",
          "y": "v",
          "stroke": "steelblue",
          "curve": "monotone-x",
          "marker": "circle"
        },
        {
          "mark": "text",
          "data": {
            "from": "md"
          },
          "x": "u",
          "y": "v",
          "text": "u",
          "fill": "steelblue"
        },
        {
          "mark": "tickY",
          "data": {
            "from": "md"
          },
          "x": "u",
          "y": "v",
          "stroke": "steelblue"
        },
        {
          "mark": "areaY",
          "data": {
            "from": "md"
          },
          "x": "u",
          "y": "v",
          "fill": "steelblue"
        }
      ]
    },
    {
      "hconcat": [
        {
          "plot": [
            {
              "mark": "dot",
              "data": {
                "from": "md"
              },
              "x": "i",
              "y": "v",
              "fill": "currentColor",
              "r": 1.5
            },
            {
              "mark": "regressionY",
              "data": {
                "from": "md"
              },
              "x": "i",
              "y": "v",
              "stroke": "steelblue"
            }
          ],
          "xDomain": [
            -0.5,
            7.5
          ]
        },
        {
          "plot": [
            {
              "mark": "hexgrid",
              "stroke": "#aaa",
              "strokeOpacity": 0.5
            },
            {
              "mark": "hexbin",
              "data": {
                "from": "md"
              },
              "x": "i",
              "y": "v",
              "fill": {
                "count": null
              }
            }
          ],
          "colorScheme": "blues",
          "xDomain": [
            -1,
            8
          ]
        },
        {
          "plot": [
            {
              "mark": "contour",
              "data": {
                "from": "md"
              },
              "x": "i",
              "y": "v",
              "stroke": "steelblue",
              "bandwidth": 15
            }
          ],
          "xDomain": [
            -1,
            8
          ]
        },
        {
          "plot": [
            {
              "mark": "raster",
              "data": {
                "from": "md"
              },
              "x": "i",
              "y": "v",
              "fill": "density",
              "bandwidth": 15
            }
          ],
          "colorScheme": "blues",
          "xDomain": [
            -1,
            8
          ]
        },
        {
          "plot": [
            {
              "mark": "denseLine",
              "data": {
                "from": "md"
              },
              "x": "i",
              "y": "v",
              "fill": "density",
              "bandwidth": 2,
              "binWidth": 1
            }
          ],
          "colorScheme": "blues",
          "xDomain": [
            -1,
            8
          ]
        }
      ]
    }
  ]
};

const earthquakesSpec = {
  "meta": {
    "title": "Earthquakes",
    "description": "A rotatable globe of earthquake activity. To show land masses, this example loads a TopoJSON file directly in the browser, bypassing the database.\n",
    "credit": "Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-earthquake-globe)."
  },
  "data": {
    "earthquakes": {
      "file": "data/earthquakes.parquet"
    },
    "land": {
      "type": "topojson",
      "file": "data/countries-110m.json",
      "feature": "land"
    }
  },
  "params": {
    "longitude": -180,
    "latitude": -30,
    "rotate": [
      "$longitude",
      "$latitude"
    ]
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "input": "slider",
          "label": "Longitude",
          "as": "$longitude",
          "min": -180,
          "max": 180,
          "step": 1
        },
        {
          "input": "slider",
          "label": "Latitude",
          "as": "$latitude",
          "min": -90,
          "max": 90,
          "step": 1
        }
      ]
    },
    {
      "plot": [
        {
          "mark": "geo",
          "data": {
            "from": "land"
          },
          "fill": "currentColor",
          "fillOpacity": 0.2
        },
        {
          "mark": "sphere"
        },
        {
          "mark": "dot",
          "data": {
            "from": "earthquakes"
          },
          "x": "longitude",
          "y": "latitude",
          "r": {
            "expr": "POW(10, magnitude)"
          },
          "stroke": "red",
          "fill": "red",
          "fillOpacity": 0.2
        }
      ],
      "style": "overflow: visible;",
      "projectionType": "orthographic",
      "projectionRotate": "$rotate"
    }
  ]
};

describe('parseSpec', () => {
  it('parses the athletes spec', async () => {
    const ast = parseSpec(athletesSpec);
    assert.strictEqual(true, true);
    console.log('AST', ast);
    console.log('MODULE', ast.codegen());
  });
  it('parses the marks spec', async () => {
    const ast = parseSpec(marksSpec);
    assert.strictEqual(true, true);
    console.log('AST', ast);
    console.log('MODULE', ast.codegen());
  });
  it('parses the earthquakes spec', async () => {
    const ast = parseSpec(earthquakesSpec);
    assert.strictEqual(true, true);
    console.log('AST', ast);
    console.log('MODULE', ast.codegen());
  });
});
