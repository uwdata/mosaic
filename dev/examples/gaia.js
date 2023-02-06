import * as vg from '../setup.js';

export default async function(el) {
  const {
    Query, coordinator, expr, plot, hconcat, vconcat, hspace,
    from, bin, count, heatmap, rectY,
    domainX, domainXY, niceX, niceY, scaleY, gridY, reverseY, scaleColor, schemeColor,
    width, height, marginLeft,
    intervalX, intervalXY, Selection, Fixed
  } = vg;

  // Load data as needed
  const q = Query
    .select('*')
    .from(expr(`'data/gaia.parquet'`))
    .where(expr(`parallax >= -5 AND parallax <= 10`));
  await coordinator().exec(`CREATE TABLE IF NOT EXISTS gaia AS ${q}`);

  const table = 'gaia';
  const brush = Selection.crossfilter();
  const bandwidth = 0;
  const scaleFactor = 2;
  const histScale = 'sqrt';

  el.appendChild(
    hconcat(
      vconcat(
        plot(
          heatmap(
            from(table, { filterBy: brush }),
            { x: 'ra', y: 'dec', fill: 'density', bandwidth, scaleFactor }
          ),
          intervalXY({ as: brush }),
          domainXY(Fixed), niceX(false), niceY(false),
          scaleColor('sqrt'), schemeColor('plasma'),
          width(600), height(400), marginLeft(65)
        ),
        hconcat(
          plot(
            rectY(
              from(table, { filterBy: brush }),
              { x: bin('phot_g_mean_mag'), y: count(), fill: 'steelblue', inset: 0.5 }
            ),
            scaleY(histScale), gridY(true),
            intervalX({ as: brush }), domainX(Fixed),
            width(300), height(200), marginLeft(65)
          ),
          plot(
            rectY(
              from(table, { filterBy: brush }),
              { x: bin('parallax'), y: count(), fill: 'steelblue', inset: 0.5 }
            ),
            scaleY(histScale), gridY(true),
            intervalX({ as: brush }), domainX(Fixed),
            width(300), height(200), marginLeft(65)
          )
        )
      ),
      hspace(30),
      plot(
        heatmap(
          from(table, { filterBy: brush }),
          { x: 'bp_rp', y: 'phot_g_mean_mag', fill: 'density', bandwidth, scaleFactor }
        ),
        scaleColor('sqrt'), schemeColor('plasma'), reverseY(true),
        intervalXY({ as: brush }), domainXY(Fixed),
        width(400), height(600), marginLeft(25)
      )
    )
  );
}
