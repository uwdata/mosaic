import * as vg from '../setup.js';

export default function(el) {
  const {
    plot, vconcat, hconcat, hspace, menu, hexbin, hexgrid, from, name,
    bin, count, rectY, rectX, colorScale, colorScheme, colorLegend,
    marginLeft, marginRight, marginBottom, marginTop,
    xAxis, yAxis, xLabelAnchor, yLabelAnchor,
    xDomain, yDomain, xyDomain, intervalX, intervalY, width, height,
    Selection, Param, Fixed
  } = vg;

  const table = 'flights';
  const x = 'time';
  const y = 'delay';
  const color = 'steelblue';
  const binWidth = 10;
  const query = Selection.crossfilter();
  const scale = Param.value('log');

  el.appendChild(
    vconcat(
      hconcat(
        menu({
          label: 'Color Scale', as: scale,
          options: ['log', 'linear', 'sqrt']
        }),
        hspace(10),
        colorLegend({ for: 'hexbins' })
      ),
      hconcat(
        plot(
          rectY(
            from(table),
            { x: bin(x), y: count(), fill: color, inset: 0.5 }
          ),
          intervalX({ as: query }),
          marginLeft(5), marginRight(5), marginTop(30), marginBottom(0),
          xDomain(Fixed), xAxis('top'), yAxis(null), xLabelAnchor('center'),
          width(710), height(70)
        ),
        hspace(80)
      ),
      hconcat(
        plot(
          hexbin(
            from(table, { filterBy: query }),
            { x, y, fill: count(), binWidth }
          ),
          hexgrid({ binWidth }),
          colorScheme('ylgnbu'), colorScale(scale),
          marginLeft(5), marginRight(0), marginTop(0), marginBottom(5),
          xAxis(null), yAxis(null), xyDomain(Fixed),
          width(705), height(505),
          name('hexbins')
        ),
        plot(
          rectX(
            from(table),
            { x: count(), y: bin(y), fill: color, inset: 0.5 }
          ),
          intervalY({ as: query }),
          marginLeft(0), marginRight(40), marginTop(4), marginBottom(5),
          yDomain([-60, 180]), xAxis(null), yAxis('right'), yLabelAnchor('center'),
          width(80), height(505)
        )
      )
    )
  );
}
