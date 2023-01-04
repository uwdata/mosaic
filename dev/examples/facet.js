export default function(el) {
  const {
    vconcat, hconcat, plot, from,
    barX, rectY, tickX, frame,
    avg, bin, count, quantile, intervalX,
    domainX, domainXY, domainFX, domainColor,
    marginLeft, marginRight, width, height, Fixed, Selection
  } = vgplot;

  const data = 'athletes';
  const brush = new Selection();

  el.appendChild(
    hconcat(
      plot(
        tickX(
          from(data),
          { x: 'weight', y: 'sport', fx: 'sex', strokeWidth: 0.5, stroke: '#ccc' }
        ),
        barX(
          from(data, { filterBy: brush }),
          { x1: quantile('weight', 0.25), x2: quantile('weight', 0.75),
            y: 'sport', fx: 'sex', fill: 'sex', fillOpacity: 0.7 }
        ),
        tickX(
          from(data, { filterBy: brush }),
          { x: avg('weight'), y: 'sport', fx: 'sex', strokeWidth: 1.5, stroke: 'black' }
        ),
        frame({ stroke: '#ccc' }),
        domainXY(Fixed), domainFX(Fixed), domainColor(Fixed),
        marginLeft(100)
      ),
      vconcat(
        plot(
          rectY(
            from(data, { filterBy: brush }),
            { x: bin('weight'), y: count(), fill: 'steelblue', inset: 0.5 }
          ),
          intervalX({ as: brush }), domainX(Fixed),
          width(300), height(120), marginRight(0)
        ),
        plot(
          rectY(
            from(data, { filterBy: brush }),
            { x: bin('height'), y: count(), fill: 'steelblue', inset: 0.5 }
          ),
          intervalX({ as: brush }), domainX(Fixed),
          width(300), height(120), marginRight(0)
        )
      )
    )
  );
}
