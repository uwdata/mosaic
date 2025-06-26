import { coordinator, DuckDBWASMConnector } from '@uwdata/mosaic-core';
import { loadParquet } from '@uwdata/mosaic-sql';
import * as vg from '@uwdata/vgplot';

const wasm = new DuckDBWASMConnector({ log: false });
coordinator().databaseConnector(wasm);

await vg.coordinator().exec([
  loadParquet("aapl", `${window.location}stocks.parquet`, {where: "Symbol = 'AAPL'"})
]);

document.getElementById("plot").replaceChildren(
  vg.plot(
    vg.lineY(
      vg.from("aapl"),
      {x: "Date", y: "Close", tip: true}
    ),
    vg.width(680),
    vg.height(200)
  )
)
