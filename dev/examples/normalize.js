import * as vg from '../setup.js';

export default async function(el) {
  const {
    coordinator, Signal, plot, from, lineY, ruleX, text, textX, nearestX,
    scaleY, domainY, gridY, tickFormatY, labelY, labelX,
    width, height, marginRight, sql, argmax, max, column, Query
  } = vg;

  const point = new Signal(new Date(Date.UTC(2013, 4, 13)));
  const table = 'stocks';
  const label = 'labels';
  const d = column('Date');
  const v = column('Close');
  const s = column('Symbol');
  const x = d;
  const y = sql`${v} / (
    SELECT MAX(${v}) FROM ${table} WHERE ${s} = source.${s} AND ${d} = ${point}
  )`;

  const q = Query
    .select({ Date: max(d), Close: argmax(v, d) }, s)
    .from(table)
    .groupby(s);
  await coordinator().exec(`
    DROP TABLE IF EXISTS stocks;
    DROP TABLE IF EXISTS labels;
    CREATE TEMP TABLE stocks AS SELECT * FROM 'http://localhost:8000/data/stocks.csv';
    CREATE TEMP TABLE labels AS ${q};
  `);

  el.appendChild(
    plot(
      ruleX({ x: point }),
      textX({ x: point, text: point, frameAnchor: 'top', lineAnchor: 'bottom', dy: -7 }),
      text(from(label), { x, y, dx: 2, text: s, fill: s, textAnchor: 'start' }),
      lineY(from(table), { x, y, stroke: s }),
      nearestX({ as: point }),
      scaleY('log'), domainY([0.2, 6]), gridY(true),
      labelX(null), labelY(null), tickFormatY('%'),
      width(650), height(400), marginRight(35)
    )
  );
}
