export default function(el) {
  const {
    Signal, plot, from, contour, heatmap, scaleColor, schemeColor,
    axisX, axisY, marginLeft, marginRight, width, height,
  } = vgplot;

  el.innerHTML = `
  Bandwidth (&sigma;): <input id="bw" type="range" min="0" max="100" value="20" step="1"></input>
  Thresholds: <input id="tz" type="range" min="2" max="20" value="10" step="1"></input>
  `;

  const bw = el.querySelector('#bw');
  bw.addEventListener('input', () => bandwidth.update(+bw.value));
  const bandwidth = new Signal(+bw.value);

  const tz = el.querySelector('#tz');
  tz.addEventListener('input', () => thresholds.update(+tz.value));
  const thresholds = new Signal(+tz.value);

  const table = 'flights';
  const x = 'time';
  const y = 'delay';

  el.appendChild(
    plot(
      scaleColor('symlog'), schemeColor('ylgnbu'),
      heatmap(from(table), { x, y, fill: 'density', bandwidth }),
      contour(from(table), { x, y, stroke: 'white', strokeOpacity: 0.5, bandwidth, thresholds }),
      axisX('top'), axisY('right'), marginLeft(5), marginRight(50),
      width(700), height(500)
    )
  );
}
