export default function(el) {
  const {
    plot, vconcat, from, bin, count, rectY,
    width, height, domainX, intervalX, Selection, Fixed
  } = vgplot;

  const table = 'flights';
  const brush = Selection.crossfilter();

  el.appendChild(
    vconcat(
      plot(
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('delay'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        domainX(Fixed),
        width(600),
        height(200)
      ),
      plot(
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('time'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        domainX(Fixed),
        width(600),
        height(200)
      ),
      plot(
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('distance'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush }),
        domainX(Fixed),
        width(600),
        height(200)
      )
    )
  );
}
