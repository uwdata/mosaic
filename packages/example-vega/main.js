import embed from "vega-embed";
import {
  MosaicClient,
  wasmConnector,
  coordinator,
  Selection,
} from "@uwdata/mosaic-core";
import {
  loadCSV,
  Query,
  isBetween,
  literal,
  dateMonth,
  mean,
  relation,
} from "@uwdata/mosaic-sql";

const spec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  layer: [
    {
      data: { name: "table" },
      params: [
        {
          name: "brush",
          select: { type: "interval", encodings: ["x"] },
        },
      ],
      mark: "bar",
      encoding: {
        x: {
          timeUnit: "month",
          field: "date",
          type: "ordinal",
        },
        y: {
          field: "precipitation",
          type: "quantitative",
        },
        opacity: {
          condition: {
            param: "brush",
            value: 1,
          },
          value: 0.7,
        },
      },
    },
    {
      data: { name: "filteredTable" },
      mark: "rule",
      encoding: {
        y: {
          aggregate: "mean",
          field: "precipitation",
          type: "quantitative",
        },
        color: { value: "firebrick" },
        size: { value: 3 },
      },
    },
  ],
};

const result = await embed("#chart", spec, { actions: false });

class SelectionVegaClient extends MosaicClient {
  constructor(opts) {
    super();

    const { view, table, dataset, selection } = opts;
    this.view = view;
    this.table = table;
    this.dataset = dataset;
    this.selection = selection;

    if (this.selection) {
      this.view.addSignalListener("brush", (name, value) => {
        const dates = value.month_date;

        if (!dates) {
          selection.update({
            source: this,
            schema: { type: "interval" },
            predicate: null,
          });
          return;
        }

        selection.update({
          source: this,
          schema: { type: "interval" },
          predicate: isBetween(
            dateMonth("date"),
            [literal(dateMonth(dates.at(0))), literal(dateMonth(dates.at(-1)))],
            false
          ),
        });
      });
    }
  }

  query(filter = []) {
    return Query.from(relation(this.table))
      .select({ date: dateMonth("date"), precipitation: mean("precipitation") })
      .groupby(dateMonth("date"))
      .where(filter);
  }

  queryResult(data) {
    this.view.data(this.dataset, Array.from(data)).resize().run();
    return this;
  }
}

class FilteredVegaClient extends MosaicClient {
  constructor(opts) {
    const { view, table, dataset, filter } = opts;
    super(filter);
    this.view = view;
    this.table = table;
    this.dataset = dataset;
  }

  query(filter = []) {
    return Query.from(relation(this.table))
      .select({ precipitation: mean("precipitation") })
      .where(filter);
  }

  queryResult(data) {
    this.view.data(this.dataset, Array.from(data)).resize().run();
    return this;
  }
}

const wasm = await wasmConnector();
coordinator().databaseConnector(wasm);

await coordinator().exec(
  loadCSV("weather", `${window.location}seattle-weather.csv`)
);

const selection = Selection.single();

const client1 = new SelectionVegaClient({
  view: result.view,
  table: "weather",
  dataset: "table",
  selection: selection,
});
coordinator().connect(client1);

const client2 = new FilteredVegaClient({
  view: result.view,
  table: "weather",
  dataset: "filteredTable",
  filter: selection,
});
coordinator().connect(client2);
