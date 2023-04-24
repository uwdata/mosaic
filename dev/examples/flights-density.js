import * as vg from '../setup.js';

export default function(el) {
  const {
    Param, slider, vconcat, hconcat, plot, from,
    contour, raster, scaleColor, schemeColor,
    axisX, axisY, labelAnchorX, labelAnchorY, zeroX,
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
        scaleColor('symlog'), schemeColor('ylgnbu'),
        raster(from(table), { x, y, fill: 'density', bandwidth }),
        contour(from(table), { x, y, stroke: 'white', strokeOpacity: 0.5, bandwidth, thresholds }),
        axisX('top'), labelAnchorX('center'), zeroX(true),
        axisY('right'), labelAnchorY('center'),
        width(700), height(500), marginLeft(5), marginRight(40)
      )
    )
  );
}
