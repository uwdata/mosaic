export default function(el) {
  const {
    plot, vconcat, hconcat, from, hexbin, hexgrid, schemeColor,
    bin, count, rectY, rectX, scaleColor,
    marginLeft, marginRight, marginBottom, marginTop,
    axisX, axisY, labelAnchorX, labelAnchorY,
    domainX, domainY, domainXY, intervalX, intervalY, width, height,
    Selection, Signal, Fixed
  } = vgplot;

  el.innerHTML = `
    Color Scale: <select id="scale">
      <option value="log" selected>Log</option>
      <option value="linear">Linear</option>
      <option value="sqrt">Square Root</option>
    </select>
  `;
  const menu = document.querySelector('#scale');
  menu.addEventListener('input', () => scale.update(menu.value));

  const table = 'flights';
  const x = 'time';
  const y = 'delay';
  const color = 'steelblue';
  const binWidth = 10;
  const query = new Selection();
  const scale = new Signal(menu.value);

  el.appendChild(
    vconcat(
      plot(
        rectY(
          from(table),
          { x: bin(x), y: count(), fill: color, inset: 0.5 }
        ),
        intervalX({ as: query }),
        marginLeft(5), marginRight(5), marginTop(30), marginBottom(0),
        domainX(Fixed), axisX('top'), axisY(null), labelAnchorX('center'),
        width(710), height(70)
      ),
      hconcat(
        plot(
          hexbin(
            from(table, { filterBy: query }),
            { x, y, fill: count(), binWidth }
          ),
          hexgrid({ binWidth }),
          schemeColor('ylgnbu'), scaleColor(scale),
          marginLeft(5), marginRight(0), marginTop(0), marginBottom(5),
          axisX(null), axisY(null), domainXY(Fixed),
          width(705), height(505)
        ),
        plot(
          rectX(
            from(table),
            { x: count(), y: bin(y), fill: color, inset: 0.5 }
          ),
          intervalY({ as: query }),
          marginLeft(0), marginRight(40), marginTop(4), marginBottom(5),
          domainY([-60, 180]), axisX(null), axisY('right'), labelAnchorY('center'),
          width(80), height(505)
        )
      )
    )
  );
}
