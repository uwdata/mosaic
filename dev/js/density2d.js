import * as vg from '../setup.js';

export default function(el = document.body) {
  const bandwidth = vg.Param.value(40);
  const bins = vg.Param.value(10);
  const table = 'penguins';
  const x = 'bill_length';
  const y = 'bill_depth';

  el.appendChild(
    vg.vconcat(
      vg.hconcat(
        vg.slider({ label: 'Bandwidth (σ)', as: bandwidth, min: 1, max: 100 }),
        vg.slider({ label: 'Bins', as: bins, min: 3, max: 40 })
      ),
      vg.plot(
        vg.density(vg.from(table), {
          x, y, r: 'density', fill: '#ddd',
          binsX: bins, binsY: bins, bandwidth
        }),
        vg.dot(vg.from(table), { x, y, fill: 'black', r: 1 }),
        vg.rScale('sqrt'), vg.rRange([0, 16]),
        vg.xAxis('bottom'), vg.xLabelAnchor('center'),
        vg.yAxis('right'), vg.yLabelAnchor('center'),
        vg.margins({ top: 5, bottom: 30, left: 5, right: 50 }),
        vg.width(700),
        vg.height(480)
      )
    )
  );
}
