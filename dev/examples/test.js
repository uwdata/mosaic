// export default async function(el) {
//   const {
//     plot, vconcat, from, rectY, barX,
//     count, intervalX, selectY,
//     domainX, domainY, domainColor, rangeColor,
//     labelY, expr,
//     width, Fixed, Selection
//   } = vgplot;

//   const table = 'weather';
//   const sel = Selection.crossfilter();

//   const weather = ['sun', 'fog', 'drizzle', 'rain', 'snow'];
//   const colors = [
//     domainColor(weather),
//     rangeColor(['#e7ba52', '#a7a7a7', '#aec7e8', '#1f77b4', '#9467bd'])
//   ];

//   el.appendChild(
//     vconcat(
//       plot(
//         rectY(
//           from(table, { filterBy: sel }),
//           {
//             x1: expr('MONTH(date)::INTEGER', ['date']),
//             x2: expr('(1 + MONTH(date))::INTEGER', ['date']),
//             y: count(), fill: 'weather', order: 'weather'
//           }
//         ),
//         intervalX({ as: sel }),
//         domainX(Fixed),
//         width(800),
//         ...colors
//       ),
//       plot(
//         barX(from(table), { x: count(), y: 'weather', fill: '#f5f5f5' }),
//         barX(
//           from(table, { filterBy: sel }),
//           { x: count(), y: 'weather', fill: 'weather' }
//         ),
//         selectY({ as: sel }),
//         domainX(Fixed),
//         domainY(weather), labelY(null),
//         width(800),
//         ...colors
//       )
//     )
//   );
// }

// // M4 LINES
// export default async function(el) {
//   const {
//     coordinator, plot, vconcat, from, lineY, intervalX, domainY, width, height, Selection, Fixed
//   } = vgplot;

//   await coordinator().exec(`
//     CREATE TABLE IF NOT EXISTS walk2 AS
//     SELECT t, v, 'A' as g FROM walk UNION ALL SELECT t, v/2 AS v, 'B' as g FROM walk
//   `);

//   const brush = Selection.intersect();
//   const strokeWidth = 1;

//   el.appendChild(
//     vconcat(
//       // plot(
//       //   lineY(from('walk2', { transform: false }), { x: 't', y: 'v', stroke: 'g', strokeWidth }),
//       //   width(800),
//       //   height(200)
//       // ),
//       self.overview = plot(
//         lineY(from('walk2'), { x: 't', y: 'v', stroke: 'g', strokeWidth }),
//         intervalX({ as: brush }),
//         width(800),
//         height(200)
//       ),
//       self.detail = plot(
//         lineY(from('walk2', { filterBy: brush }), { x: 't', y: 'v', stroke: 'g', strokeWidth }),
//         domainY(Fixed),
//         width(800),
//         height(200)
//       )
//     )
//   );
// }


// // FACETS
export default function(el) {
  const {
    Selection, Fixed, plot, vconcat, hconcat,
    from, rectY, barX, tickX, frame, avg, quantile, bin, count,
    intervalX, domainX, domainXY, domainFX, domainColor,
    marginLeft, width, height
  } = vgplot;

  const table = 'athletes';
  const brush = Selection.crossfilter();

  el.appendChild(
    hconcat(
      vconcat(
        plot(
          rectY(
            from(table, { filterBy: brush }),
            { x: bin('weight'), y: count(), fill: 'steelblue', inset: 0.5 }
          ),
          intervalX({ as: brush }),
          domainX(Fixed),
          width(300),
          height(150)
        ),
        plot(
          rectY(
            from(table, { filterBy: brush }),
            { x: bin('height'), y: count(), fill: 'steelblue', inset: 0.5 }
          ),
          intervalX({ as: brush }),
          domainX(Fixed),
          width(300),
          height(150)
        )
      ),
      plot(
        tickX(
          from(table),
          { x: 'weight', y: 'sport', fx: 'sex', strokeWidth: 0.5, stroke: '#ccc' }
        ),
        barX(
          from(table, { filterBy: brush }),
          { x1: quantile('weight', 0.25), x2: quantile('weight', 0.75),
            y: 'sport', fx: 'sex', fill: 'sex', fillOpacity: 0.7 }
        ),
        tickX(
          from(table, { filterBy: brush }),
          { x: avg('weight'), y: 'sport', fx: 'sex', strokeWidth: 1.5, stroke: 'black' }
        ),
        intervalX({ as: brush }),
        frame({ stroke: '#ccc' }),
        domainXY(Fixed), domainFX(Fixed), domainColor(Fixed),
        marginLeft(100)
      )
    )
  );
}

// function invertOrdinal(scale, value) {
//   const { domain } = scale;
//   const p = domain.map(v => scale.apply(v));
//   const i = p.findIndex(v => v > value);
//   console.log(i, p);
//   return domain[i < 0 ? domain.length - 1 : i - 1];
// }
// ye = document.querySelectorAll('g[aria-label="y-axis"]')[2];
// ys = ye.ownerSVGElement.scale('y');
// ye.addEventListener('click', (e) => {
//   const node = e.currentTarget.ownerSVGElement;
//   const rect = node.getBoundingClientRect();
//   const y = e.clientY - rect.top - node.clientTop;
//   console.log(y, invertOrdinal(ys, y));
// });


// ys.domain.map(v => ys.apply(v))
// align: 0.5
// apply: function apply(t)
// bandwidth: 18
// domain: Array(28) [ "aquatics", "archery", "athletics", … ]
// label: "sport"
// paddingInner: 0.1
// paddingOuter: 0.1
// range: Array [ 30, 620 ]
// round: true
// step: 20
// type: "band"