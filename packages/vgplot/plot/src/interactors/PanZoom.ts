import { InteractorMark } from '../marks/Mark.js';

import { Selection, clauseInterval } from '@uwdata/mosaic-core';
import { select, zoom, ZoomTransform } from 'd3';
import { getField } from './util/get-field.js';
import type * as mc from '@uwdata/mosaic-core';
import type { SVG } from '../types.js';
import * as ObPlot from '@observablehq/plot';
import type { ExprNode, ExprValue, ParamLike } from '@uwdata/mosaic-sql';

function asc(a: number, b: number): number {
  return a - b;
}


export class PanZoom implements mc.Activatable {
  mark: InteractorMark;
  xsel: Selection;
  ysel: Selection;
  xfield: any;
  yfield: any;
  zoom: any;
  panx: boolean;
  pany: boolean;
  svg?: SVG;
  initialized: any;
  xscale?: ObPlot.Scale;
  yscale?: ObPlot.Scale;

  constructor(mark: InteractorMark, {
    x = new Selection(),
    y = new Selection(),
    xfield = undefined,
    yfield = undefined,
    zoom = true,
    panx = true,
    pany = true
  }: { x?: Selection; y?: Selection; xfield?: string; yfield?: string; zoom?: boolean; panx?: boolean; pany?: boolean; }) {
    this.mark = mark;
    this.xsel = x;
    this.ysel = y;
    this.xfield = xfield || getField(mark, 'x');
    this.yfield = yfield || getField(mark, 'y');
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

  publish(transform: any): void {
    if (this.panx) {
      const xdom = rescaleX(transform, this.xscale);
      this.xsel.update(this.clause(xdom, this.xfield, this.xscale));
    }
    if (this.pany) {
      const ydom = rescaleY(transform, this.yscale);
      this.ysel.update(this.clause(ydom, this.yfield, this.yscale));
    }
  }

  clause(value: any, field?: ExprValue, scale?: any): mc.SelectionClause {
    return clauseInterval(field, value, {
      source: (this),
      clients: this.mark.plot.markSet,
      scale
    });
  }

  init(svg: SVG): void {
    this.svg = svg;
    if (this.initialized) return; else this.initialized = true;

    const { panx, pany, mark: { plot: { element } } } = this;

    this.xscale = svg.scale('x');
    this.yscale = svg.scale('y');
    const rx = Array.from(this.xscale.range).slice().sort(asc);
    const ry = Array.from(this.yscale.range).slice().sort(asc);
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
      //@ts-expect-error Property '__zoom' does not exist on type 'HTMLElement'.
      .on('end', () => element.__zoom = new ZoomTransform(1, 0, 0))
      .on('zoom', ({ transform }) => this.publish(transform));

    select(element).call(z);

    if (panx || pany) {
      let enter = false;
      element.addEventListener('pointerenter', evt => {
        if (enter) return; else enter = true;
        if (!evt.buttons) this.activate(); // don't activate if mouse down
      });
      element.addEventListener('pointerleave', () => enter = false);
    }
  }

  activate(): void {
    if (this.panx) {
      const { xscale, xfield } = this;
      this.xsel.activate(this.clause(xscale.domain, xfield, xscale));
    }
    if (this.pany) {
      const { yscale, yfield } = this;
      this.ysel.activate(this.clause(yscale.domain, yfield, yscale));
    }
  }
}

function extent(ext: boolean, defaultTrue: number[], defaultFalse: any[]): any[] {
  return ext
    ? (Array.isArray(ext) ? ext : defaultTrue)
    : defaultFalse;
}

function rescaleX(transform: { invertX: (value: any) => any; }, scale: ObPlot.Scale): any[] {
  return Array.from(scale.range)
    .map(transform.invertX, transform)
    .map(scale.invert, scale);
}

function rescaleY(transform: { invertY: (value: any) => any; }, scale: ObPlot.Scale): any[] {
  return Array.from(scale.range)
    .map(transform.invertY, transform)
    .map(scale.invert, scale);
}
