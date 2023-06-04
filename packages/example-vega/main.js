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
  column,
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
      this.view.addSignalListener("brush", (_name, signal) => {
        const dates = signal.month_date;
        const value = dates
          ? isBetween(
              dateMonth(column("date")),
              [
                dateMonth(literal(dates.at(0))),
                dateMonth(literal(dates.at(-1))),
              ],
              false
            )
          : null;

        const clause = {
          source: this,
          schema: { type: "interval" },
          value,
          predicate: value,
        };

        selection.activate(clause);
        selection.update(clause);
      });
    }
  }

  query(filter = []) {
    return Query.from(relation(this.table))
      .select({
        date: dateMonth(column("date")),
        precipitation: mean(column("precipitation")),
      })
      .groupby(dateMonth(column("date")))
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
      .select({ precipitation: mean(column("precipitation")) })
      .where(filter);
  }

  queryResult(data) {
    this.view.data(this.dataset, Array.from(data)).resize().run();
    return this;
  }
}

const wasm = await wasmConnector({ log: true });
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
