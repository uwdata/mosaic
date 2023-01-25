export default function(el) {
  const {
    plot, vconcat, from, areaY,
    width, height, domainX, domainY, intervalX,
    Selection, Fixed
  } = vgplot;

  const table = 'walk';
  const brush = Selection.intersect();

  el.appendChild(
    vconcat(
      plot(
        areaY(
          from(table),
          { x: 't', y: 'v', fill: 'steelblue' }
        ),
        intervalX({ as: brush }),
        width(800),
        height(200)
      ),
      plot(
        areaY(
          from(table, { filterBy: brush }),
          { x: 't', y: 'v', fill: 'steelblue', clip: true }
        ),
        domainY(Fixed),
        width(800),
        height(200)
      ),
      plot(
        areaY(
          from(table),
          { x: 't', y: 'v', fill: 'steelblue', clip: true }
        ),
        domainX(brush),
        domainY(Fixed),
        width(800),
        height(200)
      )
    )
  );
}
