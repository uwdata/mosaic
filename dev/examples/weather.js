export default function(el) {
  const {
    plot, vconcat, from, dot, barX,
    count, intervalX, highlight, selectY,
    domainXY, domainX, domainY, domainColor, rangeColor, domainR, rangeR,
    tickFormatX, labelY,
    width, Fixed, Selection
  } = vgplot;

  const table = 'weather';
  const range = new Selection({ cross: false });
  const click = new Selection();

  const weather = ['sun', 'fog', 'drizzle', 'rain', 'snow'];
  const colors = [
    domainColor(weather),
    rangeColor(['#e7ba52', '#a7a7a7', '#aec7e8', '#1f77b4', '#9467bd'])
  ];

  el.appendChild(
    vconcat(
      plot(
        dot(
          from(table, { filterBy: click }),
          { x: 'doy', y: 'temp_max', fill: 'weather', r: 'precipitation', order: 'precipitation', opacity: 0.7 }
        ),
        intervalX({ as: range }),
        highlight(range, { fill: '#eee' }),
        domainXY(Fixed), tickFormatX('%b'),
        rangeR([2, 10]), domainR(Fixed),
        width(800),
        ...colors
      ),
      plot(
        barX(from(table), { x: count(), y: 'weather', fill: '#f5f5f5' }),
        barX(
          from(table, { filterBy: range }),
          { x: count(), y: 'weather', fill: 'weather' }
        ),
        selectY({ as: click }),
        domainX(Fixed),
        domainY(weather), labelY(null),
        width(800),
        ...colors
      )
    )
  );
}
