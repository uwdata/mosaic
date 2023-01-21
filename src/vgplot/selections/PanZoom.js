import { select, zoom } from 'd3';
import { Selection } from '../../mosaic/index.js';
import { isBetween } from '../../sql/index.js';

const asc = (a, b) => a - b;

export class PanZoomSelection {
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
    this.xfield = xfield || mark.channelField('x', 'x1', 'x2');
    this.yfield = yfield || mark.channelField('y', 'y1', 'y2');
    this.zoom = extent(zoom, [0, Infinity], [1, 1]);
    this.panx = this.xsel && panx;
    this.pany = this.ysel && pany;

    const { plot } = mark;

    if (panx) {
      this.xsel.addListener('value', v => {
        plot.setAttribute('domainX', v).update();
      });
    }
    if (pany) {
      this.ysel.addListener('value', v => {
        plot.setAttribute('domainY', v).update();
      });
    }
  }

  update(transform) {
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
      schema: { type: 'interval', scales: [scale] },
      client: this.mark,
      value,
      predicate: value ? isBetween(field, value) : null
    };
  }

  init(svg) {
    if (this.initialized) return;
    this.initialized = true;

    const { panx, pany, mark, xsel, ysel } = this;
    const { plot } = mark;
    const { element } = plot;

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
      .on('zoom', ({ transform }) => this.update(transform));

    select(element).call(z);

    if (panx) {
      element.addEventListener('mouseenter', () => {
        xsel.activate(this.clause([0, 1]));
      });
    }
    if (pany) {
      element.addEventListener('mouseenter', () => {
        ysel.activate(this.clause([0, 1]));
      });
    }
  }
}

function extent(v, defaultTrue, defaultFalse) {
  return v
    ? (Array.isArray(zoom) ? zoom : defaultTrue)
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
