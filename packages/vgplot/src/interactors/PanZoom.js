import { select, zoom, ZoomTransform } from 'd3';
import { Selection } from '@uwdata/mosaic-core';
import { isBetween } from '@uwdata/mosaic-sql';
import { getField } from './util/get-field.js';

const asc = (a, b) => a - b;

export class PanZoom {
  constructor(mark, {
    x = new Selection(),
    y = new Selection(),
    xfield,
    yfield,
    zoom = true,
    panx = true,
    pany = true
  }) {
    this.mark = mark;
    this.xsel = x;
    this.ysel = y;
    this.xfield = xfield || getField(mark, ['x', 'x1', 'x2']);
    this.yfield = yfield || getField(mark, ['y', 'y1', 'y2']);
    this.zoom = extent(zoom, [0, Infinity], [1, 1]);
    this.panx = this.xsel && panx;
    this.pany = this.ysel && pany;

    const { plot } = mark;
    if (panx) {
      this.xsel.addEventListener('value', value => {
        if (plot.setAttribute('xDomain', value)) plot.update();
      });
    }
    if (pany) {
      this.ysel.addEventListener('value', value => {
        if (plot.setAttribute('yDomain', value)) plot.update();
      });
    }
  }

  publish(transform) {
    if (this.panx) {
      const xdom = rescaleX(transform, this.xscale);
      this.xsel.update(this.clause(xdom, this.xfield, this.xscale));
    }
    if (this.pany) {
      const ydom = rescaleY(transform, this.yscale);
      this.ysel.update(this.clause(ydom, this.yfield, this.yscale));
    }
  }

  clause(value, field, scale) {
    return {
      source: this,
      schema: { type: 'interval', scales: [scale] },
      clients: this.mark.plot.markSet,
      value,
      predicate: value ? isBetween(field, value) : null
    };
  }

  init(svg) {
    this.svg = svg;
    if (this.initialized) return; else this.initialized = true;

    const { panx, pany, mark: { plot: { element } }, xsel, ysel } = this;

    this.xscale = svg.scale('x');
    this.yscale = svg.scale('y');
    const rx = this.xscale.range.slice().sort(asc);
    const ry = this.yscale.range.slice().sort(asc);
    const tx = extent(panx, [-Infinity, Infinity], rx);
    const ty = extent(pany, [-Infinity, Infinity], ry);

    const z = zoom()
      .extent([[rx[0], ry[0]], [rx[1], ry[1]]])
      .scaleExtent(this.zoom)
      .translateExtent([[tx[0], ty[0]], [tx[1], ty[1]]])
      .on('start', () => {
        this.xscale = this.svg.scale('x');
        this.yscale = this.svg.scale('y');
      })
      .on('end', () => element.__zoom = new ZoomTransform(1, 0, 0))
      .on('zoom', ({ transform }) => this.publish(transform));

    select(element).call(z);

    if (panx || pany) {
      let enter = false;
      element.addEventListener('mouseenter', () => {
        if (enter) return; else enter = true;
        if (panx) {
          const { xscale, xfield } = this;
          xsel.activate(this.clause(xscale.domain, xfield, xscale));
        }
        if (pany) {
          const { yscale, yfield } = this;
          ysel.activate(this.clause(yscale.domain, yfield, yscale));
        }
      });
      element.addEventListener('mouseleave', () => enter = false);
    }
  }
}

function extent(ext, defaultTrue, defaultFalse) {
  return ext
    ? (Array.isArray(ext) ? ext : defaultTrue)
    : defaultFalse;
}

function rescaleX(transform, scale) {
  return scale.range
    .map(transform.invertX, transform)
    .map(scale.invert, scale);
}

function rescaleY(transform, scale) {
  return scale.range
    .map(transform.invertY, transform)
    .map(scale.invert, scale);
}
