import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = {
  "meta": {
    "title": "Sortable Table",
    "description": "A sortable, \"infinite scroll\" `table` view over a backing database table. Click column headers to sort, or command-click to reset the order. Data is queried as needed as the table is sorted or scrolled.\n"
  },
  "data": {
    "flights": {
      "file": "data/flights-200k.parquet"
    }
  },
  "input": "table",
  "from": "flights",
  "height": 300
};
