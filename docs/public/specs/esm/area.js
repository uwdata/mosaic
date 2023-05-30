import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadCSV("aapl", "data/stocks.csv", { where: "Symbol = 'AAPL'" })
);

export default vg.plot(
  vg.line(
    vg.from("aapl"),
    { x: "Date", y: "Close" }
  )
);