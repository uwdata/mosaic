export default async function(el) {
  const {
    mc, Selection, Signal, vconcat, plot, from, denseLine,
    schemeColor, labelY, domainY, intervalX, width, height, Fixed
  } = vgplot;

  el.innerHTML = `
  Bandwidth (&sigma;): <input id="bw" type="range" min="0" max="10" value="0" step="0.1"></input>
  `;

  const bw = el.querySelector('#bw');
  bw.addEventListener('input', () => bandwidth.update(+bw.value));
  const bandwidth = new Signal(+bw.value);

  await mc.exec(`
    DROP TABLE IF EXISTS sinusoids;
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
          { x, y, z, fill: 'density', bandwidth }
        ),
        schemeColor('viridis'), domainY(Fixed),
        labelY('Value (normalized lines)'),
        width(700), height(300)
      ),
      plot(
        denseLine(
          from(table),
          { x, y, z, fill: 'density', bandwidth, normalize: false }
        ),
        schemeColor('viridis'),
        labelY('Value (unnormalized lines)'),
        width(700), height(300), intervalX({ as: brush })
      )
    )
  );
}
