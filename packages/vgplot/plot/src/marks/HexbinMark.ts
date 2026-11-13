import { Query, abs, add, and, asNode, bitAnd, cond, div, float64, gt, int32, isAggregateExpression, isNotNull, lt, mul, neq, pow, round, sub } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { extentX, extentY, xyext } from './util/extent.js';
import { Mark, type Encodings, type Field } from './Mark.js';
import { handleParam } from './util/handle-param.js';
import type * as msql from '@uwdata/mosaic-sql';

export class HexbinMark extends Mark {
  binWidth: number;
  constructor(source: any, options: Record<string, any> = {}) {
    const { type = 'hexagon', binWidth = 20, ...channels } = options;
    //@ts-expect-error (see `xyext` todo)
    super(type, source, { r: binWidth / 2, clip: true, ...channels }, xyext);

    this.binWidth = handleParam(binWidth, value => {
      return (this.binWidth = value, this.requestUpdate());
    });
  }

  get filterStable(): boolean {
    const xdom = this.plot.getAttribute('xDomain');
    const ydom = this.plot.getAttribute('yDomain');
    return xdom && ydom && !xdom[Transient] && !ydom[Transient];
  }

  query(filter: msql.FilterExpr = []): msql.SelectQuery | null {
    if (this.hasOwnData()) return null;
    const { plot, binWidth, channels } = this;

    // Extract channel information, update top-level query
    // and extract dependent columns for aggregates
    let xc, yc;
    const dims = new Set<string>();
    const cols = {} as Record<string, Field>;
    for (const c of channels) {
      if (c.channel === 'orderby') {
        // ignore ordering, as we will aggregate
      } else if (c.channel === 'x') {
        xc = c;
      } else if (c.channel === 'y') {
        yc = c;
      } else if (Object.hasOwn(c, 'field')) {
        const { as, field } = c;
        cols[as] = field;
        //@ts-expect-error Type 'string' is not assignable to type 'SQLNode'.
        if (!isAggregateExpression(field)) {
          dims.add(as);
        }
      }
    }

    // get x / y extents, may update plot xDomain / yDomain
    const [x1, x2] = extentX(this, filter);
    const [y1, y2] = extentY(this, filter);

    // Adjust screen-space coordinates by top/left
    // margins as this is what Observable Plot does.
    const ox = 0.5 - plot.getAttribute('marginLeft');
    const oy = 0 - plot.getAttribute('marginTop');
    const dx = float64(binWidth);
    const dy = float64(binWidth * (1.5 / Math.sqrt(3)));
    const xr = float64(plot.innerWidth() / (x2 - x1));
    const yr = float64(plot.innerHeight() / (y2 - y1));

    // column references
    const x = '_x';
    const y = '_y';
    const px = '_px';
    const py = '_py';
    const pi = '_pi';
    const pj = '_pj';
    const tt = '_tt';

    const xc_field = asNode(xc.field);
    const yc_field = asNode(yc.field);

    // Top-level query maps from screen space back to data values.
    // Doing so ensures that Plot generates correct data-driven scales.
    //@ts-expect-error `Field` (in `cols`) is not assignable to `SelectExpr`
    return Query.select({
      [xc.as]: add(
        float64(x1),
        div(add(mul(add(x, mul(0.5, bitAnd(y, 1))), dx), ox), xr)
      ),
      [yc.as]: sub(
        float64(y2),
        div(add(mul(y, dy), oy), yr)
      ),
      ...cols
    })
      .groupby(x, y, ...dims)
      .from(
        // Subquery performs hex binning in screen space and also passes
        // original columns through (the DB should optimize this).
        Query.select({
          [py]: div(sub(mul(yr, sub(y2, yc_field)), oy), dy),
          [pj]: int32(round(py)),
          [px]: sub(
            div(sub(mul(xr, sub(xc_field, x1)), ox), dx),
            mul(0.5, bitAnd(pj, 1))
          ),
          [pi]: int32(round(px)),
          [tt]: and(
            gt(mul(abs(sub(py, pj)), 3), 1),
            gt(
              add(pow(sub(px, pi), 2), pow(sub(py, pj), 2)),
              add(
                pow(sub(sub(px, pi), mul(0.5, cond(lt(px, pi), -1, 1))), 2),
                pow(sub(sub(py, pj), cond(lt(py, pj), -1, 1)), 2)
              )
            )
          ),
          [x]: cond(tt,
            int32(add(
              add(pi, cond(lt(px, pi), -0.5, 0.5)),
              cond(neq(bitAnd(pj, 1), 0), 0.5, -0.5)
            )),
            pi
          ),
          [y]: cond(tt, int32(add(pj, cond(lt(py, pj), -1, 1))), pj)
        }, '*')
          .from(this.sourceTable())
          .where(isNotNull(xc_field), isNotNull(yc_field), filter)
      );
  }
}
