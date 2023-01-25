export default function(el) {
  const {
    vconcat, hconcat, menu, search, table, plot, from,
    dot, regressionY, domainXY, domainColor, Selection, Fixed
  } = vgplot;

  const query = Selection.intersect();
  const tbl = 'athletes';

  el.appendChild(
    vconcat(
      hconcat(
        menu({ label: 'Sport', table: tbl, column: 'sport', as: query }),
        menu({ label: 'Sex', table: tbl, column: 'sex', as: query }),
        search({ label: 'Name', table: tbl, column: 'name', type: 'contains', as: query })
      ),
      plot(
        dot(
          from(tbl, { filterBy: query }),
          { x: 'weight', y: 'height', fill: 'sex', r: 2, opacity: 0.5 }
        ),
        regressionY(
          from(tbl, { filterBy: query }),
          { x: 'weight', y: 'height', stroke: 'sex' }
        ),
        domainXY(Fixed),
        domainColor(Fixed)
      ),
      table({ table: tbl, width: 640, height: 300, filterBy: query })
    )
  );
}
