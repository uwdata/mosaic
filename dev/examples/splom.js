export default function(el) {
  const {
    plot, hconcat, vconcat, from, dot, frame,
    domainX, domainY, domainColor, intervalXY, highlight,
    width, height, axisX, axisY, ticksX, ticksY,
    labelAnchorX, labelAnchorY,
    marginTop, marginBottom, marginLeft, marginRight,
    Selection, Fixed
  } = vgplot;

  const columns = ['bill_length', 'bill_depth', 'flipper_length', 'body_mass'];
  const table = 'penguins';
  const brush = Selection.union();

  function scatter(x, y, row, col, n) {
    const s = 135;
    return plot(
      frame({ stroke: '#ccc' }),
      dot(from(table), { x, y, fill: 'species', r: 2 }),
      intervalXY({ as: brush }),
      highlight({ by: brush, opacity: 0.1 }),
      ticksX(3), ticksY(4),
      domainX(Fixed), domainY(Fixed), domainColor(Fixed),
      marginTop(5), marginRight(5),
      ...(col !== 0
        ? [axisY(null), width(s+10+5), marginLeft(10)]
        : [width(s+50+5), marginLeft(50), labelAnchorY('center')]
      ),
      ...(row !== (n - 1)
        ? [axisX(null), height(s+10+5), marginBottom(10)]
        : [height(s+35+5), marginBottom(35), labelAnchorX('center')]
      )
    )
  }

  el.appendChild(
    vconcat(columns.slice().reverse().map((y, j) =>
      hconcat(columns.map((x, i) => scatter(x, y, j, i, columns.length)))
    ))
  );
}
