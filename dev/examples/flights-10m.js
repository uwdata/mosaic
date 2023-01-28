export default async function(el) {
  const {
    coordinator, Query, Selection, Signal, Fixed, expr,
    plot, vconcat, menu, from, bin, avg, count, max, min, rectY,
    width, height, marginLeft, domainX, intervalX,
  } = vgplot;

  const aggr = new Signal('count');
  const view = document.createElement('div');
  view.innerHTML = '<br/>Loading 10M Flights data...';
  el.appendChild(
    vconcat(
      menu({
        label: 'Aggregate',
        as: aggr,
        options: [
          { value: 'count', label: 'COUNT(*)' },
          { value: 'avg', label: 'AVG(delay)' },
          { value: 'min', label: 'MIN(delay)' },
          { value: 'max', label: 'MAX(delay)' }
        ]
      }),
      view
    )
  );
  aggr.addEventListener('value', value => {
    switch (value) {
      case 'count': y = count(); return update();
      case 'avg': y = avg('delay'); return update();
      case 'min': y = min('delay'); return update();
      case 'max': y = max('delay'); return update();
    }
  });
  let y = count();

  // Load 10M flights data from the web, as needed
  const q = Query
    .select({
      delay: expr('GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE'),
      distance: 'DISTANCE',
      time: 'DEP_TIME'
    })
    .from(expr(`'https://vega.github.io/falcon/flights-10m.becad501.parquet'`));
  await coordinator().exec(`CREATE TABLE IF NOT EXISTS faa AS ${q}`);

  function update() {
    const table = 'faa';
    const cols = ['delay', 'time', 'distance'];
    const brush = Selection.crossfilter();
    view.replaceChildren(
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
