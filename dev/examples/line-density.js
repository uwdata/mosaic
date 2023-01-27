export default async function(el) {
  const {
    mc, Selection, Signal, vconcat, hconcat, plot, menu, slider, from,
    denseLine, schemeColor, labelY, intervalXY, width, height
  } = vgplot;

  await mc.exec(`
    CREATE TABLE IF NOT EXISTS sinusoids AS
    (SELECT * FROM 'data/sinusoids.parquet')
  `);

  const table = 'sinusoids';
  const x = 't';
  const y = 'v';
  const z = 's';
  const bandwidth = new Signal(0);
  const binScale = new Signal(1);
  const brush = Selection.intersect();

  el.appendChild(
    vconcat(
      hconcat(
        slider({ label: 'Bandwidth (σ)', as: bandwidth, min: 0, max: 10, step: 0.1 }),
        menu({ label: 'Bin Scale', as: binScale, options: [0.5, 1, 2] })
      ),
      plot(
        denseLine(
          from(table, { filterBy: brush }),
          { x, y, z, fill: 'density', bandwidth, binScale }
        ),
        schemeColor('viridis'),
        labelY('Value (normalized lines)'),
        width(800), height(300)
      ),
      plot(
        denseLine(
          from(table),
          { x, y, z, fill: 'density', bandwidth, binScale, normalize: false }
        ),
        schemeColor('viridis'),
        labelY('Value (unnormalized lines)'),
        width(800), height(300), intervalXY({ as: brush })
      )
    )
  );
}
