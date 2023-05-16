import * as vg from '../setup.js';

export default function(el) {
  const {
    plot, vconcat, from, axisY, domainX, densityY, intervalX,
    marginLeft, width, height, Param, Selection, Fixed, slider
  } = vg;

  const table = 'flights';
  const bandwidth = Param.value();
  const brush = Selection.crossfilter();

  el.appendChild(
    vconcat(
      slider({ label: 'Bandwidth (σ)', as: bandwidth,
        min: 0.1, max: 100, value: 10, step: 0.1 }),
      plot(
        densityY(
          from(table, { filterBy: brush }),
          { x: 'delay', bandwidth, fill: '#ccc' }
        ),
        axisY(null),
        domainX(Fixed),
        intervalX({ as: brush }),
        width(600), marginLeft(10),
        height(200)
      ),
      plot(
        densityY(
          from(table, { filterBy: brush }),
          { x: 'distance', bandwidth, fill: '#ccc' }
        ),
        axisY(null),
        domainX(Fixed),
        intervalX({ as: brush }),
        width(600), marginLeft(10),
        height(200)
      )
    )
  );
}
