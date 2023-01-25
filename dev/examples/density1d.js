export default function(el) {
  el.innerHTML = `
  Bandwidth (&sigma;): <input id="bw" type="range" min="0.1" max="100" value="10" step="0.1"></input>
  `;

  const {
    plot, vconcat, from, axisY, domainX, densityY, intervalX,
    marginLeft, width, height, Signal, Selection, Fixed
  } = vgplot;

  const bw = el.querySelector('#bw');
  bw.addEventListener('input', () => bandwidth.update(+bw.value));

  const table = 'flights';
  const bandwidth = new Signal(+bw.value);
  const brush = Selection.crossfilter();

  el.appendChild(
    vconcat(
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
