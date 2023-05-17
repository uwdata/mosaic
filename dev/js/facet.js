import * as vg from '../setup.js';

export default function(el) {
  const {
    Selection, Fixed, plot, from, barX, tickX, frame, avg, quantile,
    intervalX, xyDomain, fxDomain, colorDomain, marginLeft
  } = vg;

  const data = 'athletes';
  const brush = Selection.intersect();

  el.appendChild(
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
      intervalX({ as: brush }),
      frame({ stroke: '#ccc' }),
      xyDomain(Fixed), fxDomain(Fixed), colorDomain(Fixed),
      marginLeft(100)
    )
  );
}
