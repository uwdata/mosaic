import * as vg from '../setup.js';

export default function(el) {
  const {
    Param, slider, vconcat, hconcat, plot, from,
    contour, raster, scaleColor, schemeColor,
    axisX, axisY, marginLeft, marginRight, width, height,
  } = vg;

  const bandwidth = Param.value(20);
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
        scaleColor('symlog'), schemeColor('ylgnbu'),
        raster(from(table), { x, y, fill: 'density', bandwidth }),
        contour(from(table), { x, y, stroke: 'white', strokeOpacity: 0.5, bandwidth, thresholds }),
        axisX('top'), axisY('right'), marginLeft(5), marginRight(50),
        width(700), height(500)
      )
    )
  );
}
