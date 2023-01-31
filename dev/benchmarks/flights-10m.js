import { mplot, watchRender, startInit, brushes1d, run } from './benchmark-utils.js';
import {
  Query, Selection, Fixed, coordinator, namedPlots, vconcat, from, name,
  bin, count, expr, rectY, width, height, domainX, intervalX
} from '../setup.js';

export default async function(el) {
  // Load 10M flights data from the web, as needed
  const q = Query
    .select({
      delay: expr('GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE'),
      distance: 'DISTANCE',
      time: 'DEP_TIME'
    })
    .from(expr(`'https://vega.github.io/falcon/flights-10m.becad501.parquet'`));
  await coordinator().exec(`CREATE TABLE IF NOT EXISTS faa AS ${q}`);

  watchRender(3, () => {
    const tasks = ['delay', 'time', 'distance']
      .map(x => namedPlots.get(x))
      .flatMap(plot => brushes1d(plot.selections[0], 2));
    run(tasks);
  });
  startInit();

  const table = 'faa';
  const brush = Selection.crossfilter();
  el.appendChild(
    vconcat(
      mplot(
        name('delay'),
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('delay'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        domainX(Fixed),
        width(600),
        height(200)
      ),
      mplot(
        name('time'),
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('time'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        domainX(Fixed),
        width(600),
        height(200)
      ),
      mplot(
        name('distance'),
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('distance'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        domainX(Fixed),
        width(600),
        height(200)
      )
    )
  );
}
