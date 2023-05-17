import * as vg from '../setup.js';

export default function(el) {
  const {
    plot, hconcat, vconcat, from, dot, frame,
    xDomain, yDomain, colorDomain, intervalXY, highlight,
    width, height, xAxis, yAxis, xTicks, yTicks,
    xLabelAnchor, yLabelAnchor,
    marginTop, marginBottom, marginLeft, marginRight,
    Selection, Fixed
  } = vg;

  const columns = ['bill_length', 'bill_depth', 'flipper_length', 'body_mass'];
  const table = 'penguins';
  const brush = Selection.single();

  function scatter(x, y, row, col, n) {
    const s = 135;
    return plot(
      frame({ stroke: '#ccc' }),
      dot(from(table), { x, y, fill: 'species', r: 2 }),
      intervalXY({ as: brush }),
      highlight({ by: brush, opacity: 0.1 }),
      xTicks(3), yTicks(4),
      xDomain(Fixed), yDomain(Fixed), colorDomain(Fixed),
      marginTop(5), marginRight(5),
      ...(col !== 0
        ? [yAxis(null), width(s+10+5), marginLeft(10)]
        : [width(s+50+5), marginLeft(50), yLabelAnchor('center')]
      ),
      ...(row !== (n - 1)
        ? [xAxis(null), height(s+10+5), marginBottom(10)]
        : [height(s+35+5), marginBottom(35), xLabelAnchor('center')]
      )
    )
  }

  el.appendChild(
    vconcat(columns.slice().reverse().map((y, j) =>
      hconcat(columns.map((x, i) => scatter(x, y, j, i, columns.length)))
    ))
  );
}
