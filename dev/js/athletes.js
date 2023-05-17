import * as vg from '../setup.js';

export default function(el) {
  const {
    Selection, Fixed, vconcat, hconcat, plot, menu, search, table,
    dot, regressionY, tickX, barX, frame,
    from, avg, quantile, xyDomain, fxDomain, colorDomain,
    intervalX, intervalXY,
    width, height, marginLeft, marginTop, marginRight, hspace, vspace
  } = vg;

  const query = Selection.intersect();
  const tbl = 'athletes';

  el.appendChild(
    hconcat(
      vconcat(
        hconcat(
          menu({ label: 'Sport', from: tbl, column: 'sport', as: query }),
          menu({ label: 'Sex', from: tbl, column: 'sex', as: query }),
          search({ label: 'Name', from: tbl, column: 'name', type: 'contains', as: query })
        ),
        vspace(2),
        plot(
          dot(
            from(tbl, { filterBy: query }),
            { x: 'weight', y: 'height', fill: 'sex', r: 2, opacity: 0.05 }
          ),
          regressionY(
            from(tbl, { filterBy: query }),
            { x: 'weight', y: 'height', stroke: 'sex' }
          ),
          intervalXY({ as: query, brush: { fillOpacity: 0, stroke: 'black' }}),
          xyDomain(Fixed),
          colorDomain(Fixed),
          marginLeft(35), marginTop(20), marginRight(1),
          width(570), height(350)
        ),
        table({
          from: tbl, maxWidth: 570, height: 250, filterBy: query,
          columns: ['name', 'nationality', 'sex', 'height', 'weight', 'sport'],
          width: { name: 220, nationality: 100, sex: 50, height: 50, weight: 50, sport: 100 }
        })
      ),
      plot(
        tickX(
          from(tbl),
          { x: 'weight', y: 'sport', fx: 'sex', strokeWidth: 0.5, stroke: '#ccc' }
        ),
        barX(
          from(tbl, { filterBy: query }),
          { x1: quantile('weight', 0.25), x2: quantile('weight', 0.75),
            y: 'sport', fx: 'sex', fill: 'sex', fillOpacity: 0.7 }
        ),
        tickX(
          from(tbl, { filterBy: query }),
          { x: avg('weight'), y: 'sport', fx: 'sex', strokeWidth: 1.5, stroke: 'black' }
        ),
        intervalX({ as: query }),
        frame({ stroke: '#ccc' }),
        xyDomain(Fixed), fxDomain(Fixed), colorDomain(Fixed),
        marginLeft(100)
      )
    )
  );
}
