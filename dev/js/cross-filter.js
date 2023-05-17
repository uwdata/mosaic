import * as vg from '../setup.js';

export default function(el) {
  const {
    plot, vconcat, from, bin, count, rectY,
    width, height, xDomain, intervalX, Selection, Fixed
  } = vg;

  const table = 'flights';
  const brush = Selection.crossfilter();

  el.appendChild(
    vconcat(
      plot(
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('delay'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        xDomain(Fixed),
        width(600),
        height(200)
      ),
      plot(
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('time'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        xDomain(Fixed),
        width(600),
        height(200)
      ),
      plot(
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('distance'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        xDomain(Fixed),
        width(600),
        height(200)
      )
    )
  );
}
