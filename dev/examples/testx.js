export default function(el) {
  const {
    plot, vconcat, from, avg, bin, count, rectY, ruleX, expr, dot,
    width, height, domainX, intervalX, Selection, Fixed
  } = vgplot;

  // el.appendChild(
  //   vconcat(
  //     plot(
  //       dot(
  //         from('penguins'),
  //         {
  //           x: 'flipper_length',
  //           y: expr(`bill_length - avg(bill_length) OVER (PARTITION BY species)`, ['bill_length'], 'residual'),
  //           fill: 'species'
  //         }
  //       ),
  //       width(500),
  //       height(500)
  //     )
  //   )
  // );

  const table = 'flights';
  const brush = Selection.crossfilter();

  el.appendChild(
    vconcat(
      plot(
        rectY(
          from(table, { filterBy: brush }),
          { x: bin('delay'), y: count(), fill: 'steelblue', inset: 0.5 }
        ),
        intervalX({ as: brush, peers: false }),
        ruleX(
          from(table, { filterBy: brush }),
          { x: avg('delay'), stroke: 'red' }
        ),
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
