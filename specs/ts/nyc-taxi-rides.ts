import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "NYC Taxi Rides",
    "description": "Pickup and dropoff points for 1M NYC taxi rides on Jan 1-3, 2010.\nThis example projects lon/lat coordinates in the database upon load.\nSelect a region in one plot to filter the other.\nWhat spatial patterns can you find?\nRequires the DuckDB `spatial` extension.\n\n_You may need to wait a few seconds for the dataset to load._\n"
  },
  "config": {
    "extensions": "spatial"
  },
  "data": {
    "rides": {
      "file": "https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/nyc-rides-2010.parquet",
      "select": [
        "pickup_datetime::TIMESTAMP AS datetime",
        "ST_Transform(ST_Point(pickup_latitude, pickup_longitude), 'EPSG:4326', 'ESRI:102718') AS pick",
        "ST_Transform(ST_Point(dropoff_latitude, dropoff_longitude), 'EPSG:4326', 'ESRI:102718') AS drop"
      ]
    },
    "trips": "SELECT\n  (HOUR(datetime) + MINUTE(datetime)/60) AS time,\n  ST_X(pick) AS px, ST_Y(pick) AS py,\n  ST_X(drop) AS dx, ST_Y(drop) AS dy\nFROM rides\n"
  },
  "params": {
    "filter": {
      "select": "crossfilter"
    }
  },
  "vconcat": [
    {
      "hconcat": [
        {
          "plot": [
            {
              "mark": "raster",
              "data": {
                "from": "trips",
                "filterBy": "$filter"
              },
              "x": "px",
              "y": "py",
              "bandwidth": 0
            },
            {
              "select": "intervalXY",
              "as": "$filter"
            },
            {
              "mark": "text",
              "data": [
                {
                  "label": "Taxi Pickups"
                }
              ],
              "dx": 10,
              "dy": 10,
              "text": "label",
              "fill": "black",
              "fontSize": "1.2em",
              "frameAnchor": "top-left"
            }
          ],
          "width": 335,
          "height": 550,
          "margin": 0,
          "xAxis": null,
          "yAxis": null,
          "xDomain": [
            975000,
            1005000
          ],
          "yDomain": [
            190000,
            240000
          ],
          "colorScale": "symlog",
          "colorScheme": "blues"
        },
        {
          "hspace": 10
        },
        {
          "plot": [
            {
              "mark": "raster",
              "data": {
                "from": "trips",
                "filterBy": "$filter"
              },
              "x": "dx",
              "y": "dy",
              "bandwidth": 0
            },
            {
              "select": "intervalXY",
              "as": "$filter"
            },
            {
              "mark": "text",
              "data": [
                {
                  "label": "Taxi Dropoffs"
                }
              ],
              "dx": 10,
              "dy": 10,
              "text": "label",
              "fill": "black",
              "fontSize": "1.2em",
              "frameAnchor": "top-left"
            }
          ],
          "width": 335,
          "height": 550,
          "margin": 0,
          "xAxis": null,
          "yAxis": null,
          "xDomain": [
            975000,
            1005000
          ],
          "yDomain": [
            190000,
            240000
          ],
          "colorScale": "symlog",
          "colorScheme": "oranges"
        }
      ]
    },
    {
      "vspace": 10
    },
    {
      "plot": [
        {
          "mark": "rectY",
          "data": {
            "from": "trips"
          },
          "x": {
            "bin": "time"
          },
          "y": {
            "count": null
          },
          "fill": "steelblue",
          "inset": 0.5
        },
        {
          "select": "intervalX",
          "as": "$filter"
        }
      ],
      "yTickFormat": "s",
      "xLabel": "Pickup Hour →",
      "width": 680,
      "height": 100
    }
  ]
};
