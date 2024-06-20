import { coordinator, wasmConnector } from '@uwdata/mosaic-core';
import * as vg from '@uwdata/vgplot';

let connector = wasmConnector();
let db = await connector.getDuckDB();
coordinator().databaseConnector(connector);

//var headers = [];
export function loadCSVToDuckDB(csvFile) {
  if (csvFile) {
    var reader = new FileReader();
    reader.readAsText(csvFile, "UTF-8");
    reader.onload = function (evt) {
      db.registerFileText(csvFile.name, evt.target.result);
      //headers = evt.target.result.split("\n")[0].split(",");
      //console.log(headers);
      coordinator().exec([
        vg.loadCSV("dataprof", csvFile.name, {replace : true})
      ]);
      console.log(csvFile.name + " loaded");
    }
  }
}    

document.getElementById('csvFileInput').addEventListener('input', async (event) => { 
  const file = event.target.files[0];
  if (file) {
    loadCSVToDuckDB(file);
    await coordinator().exec();

    var col = await coordinator().query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'dataprof'
    `, {cache : false});
    console.log(col);
    var type = await coordinator().query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_name = 'dataprof'
    `, {cache : false});

    var columnNames = Array.from(col).map(row => row.column_name);
    var columnTypes = Array.from(type).map(row => row.data_type);

    console.log(columnNames);
    console.log(columnTypes);

    const $brush = vg.Selection.crossfilter();

    var plots = [];

    for (let i = 0; i < columnNames.length; i++) {
      if (columnTypes[i] == 'DOUBLE' || columnTypes[i] == 'BIGINT') {
        plots.push(vg.plot(
          vg.rectY(
            vg.from("dataprof", { filterBy: $brush }),
            { x: vg.bin(columnNames[i]), y: vg.count(), fill: "steelblue", inset: 0.5 }
          ),
          vg.intervalX({ as: $brush }),
          vg.xDomain(vg.Fixed),
          vg.yTickFormat("s"),
          vg.width(600),
          vg.height(200)
        ));
      } else if (columnTypes[i] == 'DATE'){
        var c = await coordinator().query(`
        SELECT ${columnNames[i]}, COUNT(*) AS count
        FROM dataprof
        GROUP BY ${columnNames[i]}`, {cache : false});

        console.log(c);
        const counts = Array.from(c).map(row => row.count);
        console.log(counts);

        plots.push(vg.plot(
          vg.areaY(
            vg.from("dataprof", { filterBy: $brush }),
            { x: columnNames[i], y: counts, fill: "steelblue", inset: 0.5 }
          ),
          vg.intervalX({ as: $brush }),
          vg.width(680),
          vg.height(200),
        ));
      }
    }

    document.querySelector("#view").replaceChildren(vg.vconcat(plots));
  }
});



