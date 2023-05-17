import * as vg from '../setup.js';

export default async function(el) {
  const {
    coordinator, Selection, Param, vconcat, hconcat, plot, menu, slider, from,
    denseLine, colorScheme, yLabel, yNice, intervalXY, width, height
  } = vg;

  await coordinator().exec(`
    CREATE TEMP TABLE IF NOT EXISTS sinusoids AS
    (SELECT * FROM 'data/sinusoids.parquet')
  `);

  const table = 'sinusoids';
  const x = 't';
  const y = 'v';
  const z = 's';
  const bandwidth = Param.value(0);
  const binWidth = Param.value(1);
  const brush = Selection.intersect();

  el.appendChild(
    vconcat(
      hconcat(
        slider({ label: 'Bandwidth (σ)', as: bandwidth, min: 0, max: 10, step: 0.1 }),
        menu({ label: 'Bin Width', as: binWidth, options: [0.5, 1, 2] })
      ),
      plot(
        denseLine(
          from(table, { filterBy: brush }),
          { x, y, z, fill: 'density', bandwidth, binWidth }
        ),
        colorScheme('viridis'),
        yLabel('Value (normalized lines)'), yNice(true),
        width(800), height(300)
      ),
      plot(
        denseLine(
          from(table),
          { x, y, z, fill: 'density', bandwidth, binWidth, normalize: false }
        ),
        intervalXY({ as: brush }),
        colorScheme('viridis'),
        yLabel('Value (unnormalized lines)'), yNice(true),
        width(800), height(300)
      )
    )
  );
}
