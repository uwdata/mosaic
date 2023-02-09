import * as vg from '../setup.js';

export default function(el = document.body) {
  const bandwidth = vg.Param.value(40);
  const thresholds = vg.Param.value(10);
  const table = 'penguins';
  const x = 'bill_length';
  const y = 'bill_depth';

  el.appendChild(
    vg.vconcat(
      vg.hconcat(
        vg.slider({ label: 'Bandwidth (σ)', as: bandwidth, min: 1, max: 100 }),
        vg.slider({ label: 'Thresholds', as: thresholds, min: 2, max: 20 })
      ),
      vg.plot(
        vg.raster(vg.from(table), { x, y, fill: 'species', bandwidth }),
        vg.contour(vg.from(table), { x, y, stroke: 'species', bandwidth, thresholds }),
        vg.dot(vg.from(table), { x, y, fill: 'black', r: 1 }),
        vg.axisX('bottom'), vg.labelAnchorX('center'),
        vg.axisY('right'), vg.labelAnchorY('center'),
        vg.margins({ top: 5, bottom: 30, left: 5, right: 40 }),
        vg.width(700),
        vg.height(480)
      )
    )
  );
}
