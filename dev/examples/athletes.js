export default function(el) {
  const {
    Selection, Fixed, vconcat, hconcat, plot, menu, search, table,
    dot, regressionY, from, domainXY, domainColor
  } = vgplot;
  const query = Selection.intersect();
  const tbl = 'athletes';

  el.appendChild(
    vconcat(
      hconcat(
        menu({ label: 'Sport', from: tbl, column: 'sport', as: query }),
        menu({ label: 'Sex', from: tbl, column: 'sex', as: query }),
        search({ label: 'Name', from: tbl, column: 'name', type: 'contains', as: query })
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
      table({ from: tbl, width: 640, height: 300, filterBy: query })
    )
  );
}
