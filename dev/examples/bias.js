import * as vg from '../setup.js';

export default function(el) {
  const {
    Signal, plot, vconcat, slider, from, areaY,
    width, height, sql, column
  } = vg;

  const table = 'walk';
  const point = new Signal(0);

  el.appendChild(
    vconcat(
      slider({ as: point, label: 'Bias', min: 1, max: 1000, step: 0.1 }),
      plot(
        areaY(from(table), {
          x: 't',
          y: sql`${column('v')} + ${point}`,
          fill: 'steelblue'
        }),
        width(640),
        height(200)
      )
    )
  );
}
