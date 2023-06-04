import {
  MosaicClient,
  Selection,
  coordinator,
  wasmConnector,
} from "@uwdata/mosaic-core";
import {
  Query,
  dateMonth,
  isBetween,
  literal,
  loadCSV,
  mean,
} from "@uwdata/mosaic-sql";
import embed from "vega-embed";

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
              dateMonth("date"),
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
    return Query.select({
      date: dateMonth("date"),
      precipitation: mean("precipitation"),
    })
      .from(this.table)
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
    return Query.select({ precipitation: mean("precipitation") })
      .from(this.table)
      .where(filter);
  }

  queryResult(data) {
    this.view.data(this.dataset, Array.from(data)).run();
    return this;
  }
}

async function init() {
  const result = await embed("#chart", spec, { actions: false });

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
}

init();
