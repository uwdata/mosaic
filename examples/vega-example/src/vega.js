import { MosaicClient } from '@uwdata/mosaic-core';
import { Query, avg, dateMonth, isBetween, literal } from '@uwdata/mosaic-sql';

/** @type {import('vega-lite').TopLevelSpec} */
export const spec = {
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
          timeUnit: "utcmonth",
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

export class SelectionVegaClient extends MosaicClient {
  constructor(opts) {
    super();

    const { view, table, dataset, selection } = opts;
    this.view = view;
    this.table = table;
    this.dataset = dataset;
    this.selection = selection;

    if (this.selection) {
      this.view.addSignalListener("brush", (_name, signal) => {
        const dates = signal.utcmonth_date;
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

        const scale = this.view.scale("x");

        const clause = {
          source: this,
          schema: {
            type: "interval",
            scales: [
              { type: "time", domain: scale.domain(), range: scale.range() },
            ],
          },
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
      precipitation: avg("precipitation"),
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

export class FilteredVegaClient extends MosaicClient {
  constructor(opts) {
    const { view, table, dataset, filter } = opts;
    super(filter);
    this.view = view;
    this.table = table;
    this.dataset = dataset;
  }

  query(filter = []) {
    return Query.select({ precipitation: avg("precipitation") })
      .from(this.table)
      .where(filter);
  }

  queryResult(data) {
    this.view.data(this.dataset, Array.from(data)).run();
    return this;
  }
}
