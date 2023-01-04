export default function(el = document.body) {
  const vg = vgplot;

  el.innerHTML = `
  Bandwidth (&sigma;): <input id="bw" type="range" min="1" max="100" value="40" step="1"></input>
  Thresholds: <input id="tz" type="range" min="2" max="20" value="10" step="1"></input>
  `;

  const bw = el.querySelector('#bw');
  bw.addEventListener('input', () => bandwidth.update(+bw.value));
  const bandwidth = new vg.Signal('bw', +bw.value);

  const tz = el.querySelector('#tz');
  tz.addEventListener('input', () => thresholds.update(+tz.value));
  const thresholds = new vg.Signal('tz', +tz.value);

  const table = 'penguins';
  const x = 'bill_length';
  const y = 'bill_depth';

  el.appendChild(
    vg.plot(
      vg.heatmap(vg.from(table), { x, y, fill: 'species', bandwidth }),
      vg.contour(vg.from(table), { x, y, stroke: 'species', bandwidth, thresholds }),
      vg.dot(vg.from(table), { x, y, fill: 'black', r: 1 }),
      vg.axisX('bottom'), vg.labelAnchorX('center'),
      vg.axisY('right'), vg.labelAnchorY('center'),
      vg.margins({ top: 5, bottom: 30, left: 5, right: 40 }),
      vg.width(700),
      vg.height(480)
    )
  );
}
