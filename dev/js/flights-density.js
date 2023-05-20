import * as vg from '../setup.js';

export default function(el) {
  const {
    Param, slider, vconcat, hconcat, plot, from,
    contour, raster, colorScale, colorScheme,
    xAxis, yAxis, xLabelAnchor, yLabelAnchor, xZero,
    marginLeft, marginRight, width, height,
  } = vg;

  const bandwidth = Param.value(7);
  const thresholds = Param.value(10);
  const table = 'flights';
  const x = 'time';
  const y = 'delay';

  el.appendChild(
    vconcat(
      hconcat(
        slider({ label: 'Bandwidth (σ)', as: bandwidth, min: 1, max: 100 }),
        slider({ label: 'Thresholds', as: thresholds, min: 2, max: 20 })
      ),
      plot(
        colorScale('symlog'), colorScheme('ylgnbu'),
        raster(from(table), { x, y, fill: 'density', bandwidth }),
        contour(from(table), { x, y, stroke: 'white', strokeOpacity: 0.5, bandwidth, thresholds }),
        xAxis('top'), xLabelAnchor('center'), xZero(true),
        yAxis('right'), yLabelAnchor('center'),
        width(700), height(500), marginLeft(5), marginRight(40)
      )
    )
  );
}
