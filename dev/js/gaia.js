import * as vg from '../setup.js';

export default async function(el) {
  const {
    Query, coordinator, sql, isBetween, plot, hconcat, vconcat, hspace,
    from, bin, count, raster, rectY,
    domainX, domainXY, scaleY, gridY, reverseY, scaleColor, schemeColor,
    width, height, marginLeft, marginTop, marginRight,
    intervalX, intervalXY, Selection, Fixed
  } = vg;

  // Load data as needed
  const q = Query
    .with({
      tmp: Query.select({
        lambda: sql`radians((-l + 540) % 360 - 180)`,
        phi: sql`radians(b)`,
        t: sql`asin(sqrt(3)/2 * sin(phi))`,
        t2: sql`t^2`,
        t6: sql`t2^3`
      }, '*')
      .from(sql`'https://uwdata.github.io/mosaic-datasets/data/gaia-5m.parquet'`)
    }).select({
      u: sql`(1.340264 * lambda * cos(t)) / (sqrt(3)/2 * (1.340264 + (-0.081106 * 3 * t2) + (t6 * (0.000893 * 7 + 0.003796 * 9 * t2))))`,
      v: sql`t * (1.340264 + (-0.081106 * t2) + (t6 * (0.000893 + 0.003796 * t2)))`
    }, '* EXCLUDE(\'t\', \'t2\', \'t6\')')
    .from('tmp')
    .where(isBetween('parallax', [-5, 10]));

  await coordinator().exec(`CREATE TABLE IF NOT EXISTS gaia AS ${q}`);

  const table = 'gaia';
  const brush = Selection.crossfilter();
  const bandwidth = 0;
  const binWidth = 2;
  const binType = 'normal';
  const histScale = 'sqrt';
  const pixelSize = 2;

  el.appendChild(
    hconcat(
      vconcat(
        plot(
          raster(
            from(table, { filterBy: brush }),
            { x: 'u', y: 'v', fill: 'density', bandwidth, binType, binWidth }
          ),
          intervalXY({ as: brush, pixelSize }),
          domainXY(Fixed),
          scaleColor('sqrt'), schemeColor('viridis'),
          width(700), height(400), marginLeft(25), marginTop(20), marginRight(1)
        ),
        hconcat(
          plot(
            rectY(
              from(table, { filterBy: brush }),
              { x: bin('phot_g_mean_mag'), y: count(), fill: 'steelblue', inset: 0.5 }
            ),
            scaleY(histScale), gridY(true),
            intervalX({ as: brush }), domainX(Fixed),
            width(350), height(200), marginLeft(65)
          ),
          plot(
            rectY(
              from(table, { filterBy: brush }),
              { x: bin('parallax'), y: count(), fill: 'steelblue', inset: 0.5 }
            ),
            scaleY(histScale), gridY(true),
            intervalX({ as: brush }), domainX(Fixed),
            width(350), height(200), marginLeft(65)
          )
        )
      ),
      hspace(30),
      plot(
        raster(
          from(table, { filterBy: brush }),
          { x: 'bp_rp', y: 'phot_g_mean_mag', fill: 'density', bandwidth, binType, binWidth }
        ),
        scaleColor('sqrt'), schemeColor('viridis'), reverseY(true),
        intervalXY({ as: brush, pixelSize }), domainXY(Fixed),
        width(400), height(600), marginLeft(25), marginTop(20), marginRight(1)
      )
    )
  );
}
