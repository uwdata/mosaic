export default async function(el) {
  const {
    mc, Selection, Signal, vconcat, plot, from, denseLine,
    schemeColor, labelY, domainY, intervalX, width, height, Fixed
  } = vgplot;

  el.innerHTML = `
  Bandwidth (&sigma;): <input id="bw" type="range" min="0" max="10" value="0" step="0.1"></input>
  Scale Factor: <select id="sf">
    <option value="0.5">0.5</option>
    <option value="1" selected>1.0</option>
    <option value="2">2.0</option>
  </select>`;

  const bw = el.querySelector('#bw');
  bw.addEventListener('input', () => bandwidth.update(+bw.value));
  const bandwidth = new Signal(+bw.value);

  const sf = el.querySelector('#sf');
  sf.addEventListener('input', () => scaleFactor.update(+sf.value));
  const scaleFactor = new Signal(+sf.value);

  await mc.exec(`
    CREATE TABLE IF NOT EXISTS sinusoids AS
    (SELECT * FROM 'data/sinusoids.parquet')
  `);

  const table = 'sinusoids';
  const x = 't';
  const y = 'v';
  const z = 's';

  const brush = new Selection();

  el.appendChild(
    vconcat(
      plot(
        denseLine(
          from(table, { filterBy: brush }),
          { x, y, z, fill: 'density', bandwidth, scaleFactor }
        ),
        schemeColor('viridis'), domainY(Fixed),
        labelY('Value (normalized lines)'),
        width(800), height(300)
      ),
      plot(
        denseLine(
          from(table),
          { x, y, z, fill: 'density', bandwidth, scaleFactor, normalize: false }
        ),
        schemeColor('viridis'),
        labelY('Value (unnormalized lines)'),
        width(800), height(300), intervalX({ as: brush })
      )
    )
  );
}
