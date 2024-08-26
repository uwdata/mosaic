import { clausePoint, clausePoints, isSelection } from '@uwdata/mosaic-core';
import { select, pointer } from 'd3';
import { getField } from './util/get-field.js';

export class Nearest {
  constructor(mark, {
    selection,
    pointer,
    channels,
    fields,
    maxRadius = 40
  }) {
    this.mark = mark;
    this.selection = selection;
    this.clients = new Set().add(mark);
    this.pointer = pointer;
    this.channels = channels || (
      pointer === 'x' ? ['x'] : pointer === 'y' ? ['y'] : ['x', 'y']
    );
    this.fields = fields || this.channels.map(c => getField(mark, [c]));
    this.maxRadius = maxRadius;
    this.valueIndex = -1;
  }

  clause(value) {
    const { clients, fields } = this;
    const opt = { source: this, clients };
    // if only one field, use a simpler clause that passes the value
    // this allows a single field selection value to act like a param
    return fields.length > 1
      ? clausePoints(fields, value ? [value] : value, opt)
      : clausePoint(fields[0], value?.[0], opt);
  }

  init(svg) {
    const that = this;
    const { mark, channels, selection, maxRadius } = this;
    const { data: { columns } } = mark;
    const keys = channels.map(c => mark.channelField(c).as);
    const param = !isSelection(selection);

    const facets = select(svg).selectAll('g[aria-label="facet"]');
    const root = facets.size() ? facets : select(svg);

    // extract x, y coordinates for data values and determine scale factors
    const xscale = svg.scale('x').apply;
    const yscale = svg.scale('y').apply;
    const X = Array.from(columns[mark.channelField('x').as], xscale);
    const Y = Array.from(columns[mark.channelField('y').as], yscale);
    const sx = this.pointer === 'y' ? 0.01 : 1;
    const sy = this.pointer === 'x' ? 0.01 : 1;

    // find value nearest to pointer and update param or selection
    // we don't pass undefined values to params, but do allow empty selections
    root.on('pointerenter pointerdown pointermove', function(evt) {
      const [px, py] = pointer(evt, this);
      const i = findNearest(X, Y, px, py, sx, sy, maxRadius);
      if (i !== this.valueIndex) {
        this.valueIndex = i;
        const v = i < 0 ? undefined : keys.map(k => columns[k][i]);
        if (param) {
          if (i > -1) selection.update(v.length > 1 ? v : v[0]);
        } else {
          selection.update(that.clause(v));
        }
      }
    });

    // if not a selection, we're done
    if (param) return;

    // clear selection upon pointer exit
    root.on('pointerleave', () => {
      selection.update(that.clause(undefined));
    });

    // trigger activation updates
    svg.addEventListener('pointerenter', evt => {
      if (!evt.buttons) {
        const v = this.channels.map(() => 0);
        selection.activate(this.clause(v));
      }
    });
  }
}

/**
 * Find the nearest data point to the pointer. The nearest point
 * is found via Euclidean distance, but with scale factors *sx* and
 * *sy* applied to the x and y distances. For example, to prioritize
 * selection along the x-axis, use *sx* = 1, *sy* = 0.01.
 * @param {number[]} x Array of data point x coordinate values.
 * @param {number[]} y Array of data point y coordinate values.
 * @param {number} px The x coordinate of the pointer.
 * @param {number} py The y coordinate of the pointer.
 * @param {number} sx A scale factor for x coordinate spans.
 * @param {number} sy A scale factor for y coordinate spans.
 * @param {number} maxRadius The maximum pointer distance for selection.
 * @returns {number} An integer index into the data array corresponding
 *  to the nearest data point, or -1 if no nearest point is found.
 */
function findNearest(x, y, px, py, sx, sy, maxRadius) {
  let dist = maxRadius * maxRadius;
  let nearest = -1;
  for (let i = 0; i < x.length; ++i) {
    const dx = sx * (x[i] - px);
    const dy = sy * (y[i] - py);
    const dd = dx * dx + dy * dy;
    if (dd <= dist) {
      dist = dd;
      nearest = i;
    }
  }
  return nearest;
}
