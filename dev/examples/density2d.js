export default function(el) {
  const {
    Signal, slider, vconcat, hconcat, plot, from,
    contour, heatmap, scaleColor, schemeColor,
    axisX, axisY, marginLeft, marginRight, width, height,
  } = vgplot;

  const bandwidth = new Signal(20);
  const thresholds = new Signal(10);
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
        heatmap(from(table), { x, y, fill: 'density', bandwidth }),
        contour(from(table), { x, y, stroke: 'white', strokeOpacity: 0.5, bandwidth, thresholds }),
        axisX('top'), axisY('right'), marginLeft(5), marginRight(50),
        width(700), height(500)
      )
    )
  );
}
