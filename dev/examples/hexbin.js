import * as vg from '../setup.js';

export default function(el) {
  const {
    plot, vconcat, hconcat, hspace, menu, hexbin, hexgrid, from, name,
    bin, count, rectY, rectX, scaleColor, schemeColor, legendColor,
    marginLeft, marginRight, marginBottom, marginTop,
    axisX, axisY, labelAnchorX, labelAnchorY,
    domainX, domainY, domainXY, intervalX, intervalY, width, height,
    Selection, Signal, Fixed
  } = vg;

  const table = 'flights';
  const x = 'time';
  const y = 'delay';
  const color = 'steelblue';
  const binWidth = 10;
  const query = Selection.crossfilter();
  const scale = new Signal('log');

  el.appendChild(
    vconcat(
      hconcat(
        menu({
          label: 'Color Scale', as: scale,
          options: ['log', 'linear', 'sqrt']
        }),
        hspace(10),
        legendColor({ for: 'hexbins' })
      ),
      hconcat(
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
        hspace(80)
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
          domainY([-60, 180]), axisX(null), axisY('right'), labelAnchorY('center'),
          width(80), height(505)
        )
      )
    )
  );
}
