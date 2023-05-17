import * as vg from '../setup.js';

export default function(el) {
  const {
    plot, vconcat, from, areaY, intervalX,
    width, height, xDomain, yDomain,
    Selection, Fixed
  } = vg;

  const table = 'walk';
  const brush = Selection.intersect();

  el.appendChild(
    vconcat(
      plot(
        areaY(
          from(table),
          { x: 't', y: 'v', fill: 'steelblue' }
        ),
        intervalX({ as: brush }),
        width(800),
        height(200)
      ),
      plot(
        areaY(
          from(table, { filterBy: brush }),
          { x: 't', y: 'v', fill: 'steelblue', clip: true }
        ),
        yDomain(Fixed),
        width(800),
        height(200)
      ),
      plot(
        areaY(
          from(table),
          { x: 't', y: 'v', fill: 'steelblue', clip: true }
        ),
        xDomain(brush),
        yDomain(Fixed),
        width(800),
        height(200)
      )
    )
  );
}
