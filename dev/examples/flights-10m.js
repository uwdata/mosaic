export default async function(el) {
  const {
    Query, mc, expr, plot, vconcat, from, bin, avg, count, max, min, rectY,
    width, height, marginLeft, domainX, intervalX, Selection, Fixed
  } = vgplot;

  el.innerHTML = `
    Aggregate: <select id="aggr">
      <option value="count" selected>COUNT(*)</option>
      <option value="avg">AVG(delay)</option>
      <option value="min">MIN(delay)</option>
      <option value="max">MAX(delay)</option>
    </select>
    <div id="view"><br/>Loading 10M flights data...</div>
  `;

  // Load 10M flights data from the web, as needed
  const q = Query
    .select({
      delay: expr('GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE'),
      distance: 'DISTANCE',
      time: 'DEP_TIME'
    })
    .from(expr(`'https://vega.github.io/falcon/flights-10m.becad501.parquet'`));
  await mc.exec(`CREATE TABLE IF NOT EXISTS faa AS ${q}`);

  // Choose which aggregation function to use
  const menu = document.querySelector('#aggr');
  menu.addEventListener('input', () => {
    switch (menu.value) {
      case 'count': y = count(); return update();
      case 'avg': y = avg('delay'); return update();
      case 'min': y = min('delay'); return update();
      case 'max': y = max('delay'); return update();
    }
  });
  let y = count();

  function update() {
    const table = 'faa';
    const cols = ['delay', 'time', 'distance'];
    const brush = Selection.crossfilter();
    el.querySelector('#view').replaceChildren(
      vconcat(
        cols.map(col => {
          return plot(
            rectY(
              from(table, { filterBy: brush }),
              { x: bin(col), y, fill: 'steelblue', inset: 0.5 }
            ),
            intervalX({ as: brush }),
            domainX(Fixed),
            width(600), marginLeft(75),
            height(200)
          );
        })
      )
    );
  }

  update();
}
