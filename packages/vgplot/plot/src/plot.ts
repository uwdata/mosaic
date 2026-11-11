import { distinct, Synchronizer } from '@uwdata/mosaic-core';
import type * as mc from '@uwdata/mosaic-core';
import { plotRenderer } from './plot-renderer.js';
import { guideMarks } from './marks/util/guide-marks.js';
import type { Mark } from './marks/Mark.js';
import type { Legend } from './legend.js';
import type { Attributes, AttrName, Interactor } from './types.js';

const DEFAULT_ATTRIBUTES = {
  width: 640,
  marginLeft: 40,
  marginRight: 20,
  marginTop: 20,
  marginBottom: 30
};


type AttrCallback = (name: AttrName, value: any) => unknown;

export class Plot {
  attributes: Attributes;
  listeners: Map<AttrName, Set<AttrCallback>>;
  interactors: Interactor[];
  legends: { legend: Legend, include: boolean; }[];
  marks: Mark[];
  markset: Set<Mark> | null;
  params: Map<mc.Param<any>, Mark[]>;
  synch: Synchronizer<Mark>;
  element: HTMLElement & { value: Plot; };
  pendingRender: boolean | undefined;

  constructor(element?: HTMLElement) {
    this.attributes = { ...DEFAULT_ATTRIBUTES };
    this.listeners = new Map;
    this.interactors = [];
    this.legends = [];
    this.marks = [];
    this.markset = null;
    this.params = new Map;
    this.synch = new Synchronizer();

    const el = element || document.createElement('div');
    el.setAttribute('class', 'plot');
    el.style.display = 'flex';
    this.element = Object.assign(el, { value: this });
  }

  margins(): { left: number; top: number; bottom: number; right: number; } {
    return {
      left: this.getAttribute('marginLeft'),
      top: this.getAttribute('marginTop'),
      bottom: this.getAttribute('marginBottom'),
      right: this.getAttribute('marginRight')
    };
  }

  innerWidth(): number {
    const { left, right } = this.margins();
    return this.getAttribute('width') - left - right;
  }

  innerHeight(defaultValue: number = 400): number {
    const { top, bottom } = this.margins();
    let h = this.getAttribute('height');
    if (h == null) {
      // TODO could apply more nuanced logic here?
      h = maybeAspectRatio(this, top, bottom) || defaultValue;
      this.setAttribute('height', h, { silent: true });
    }
    return h - top - bottom;
  }

  pending(mark: Mark): void {
    this.synch.pending(mark);
  }

  update(mark?: Mark): Promise<void> {
    if (this.synch.ready(mark) && !this.pendingRender) {
      this.pendingRender = true;
      requestAnimationFrame(() => this.render());
    }
    return this.synch.promise;
  }

  async render(): Promise<void> {
    this.pendingRender = false;
    const svg = await plotRenderer(this);
    const legends = this.legends.flatMap(({ legend, include }) => {
      const el = legend.init(svg);
      return include ? el : [];
    });
    this.element.replaceChildren(svg, ...legends);
    this.synch.resolve();
  }

  // TODO @dangotbanned: use `name: AttrName` after making all usage static
  /**
   * @param name The attribute to return.
   * @returns The value of the attribute.
   */
  getAttribute(name: string): any {
    return this.attributes[name];
  }

  /**
   * @param name The name of the attribute to set.
   * @param value The value to set.
   * @param options Options for setting the attribute.
   * @returns whether the value changed.
   */
  setAttribute(name: AttrName, value: any, options?: { silent: boolean; }): boolean {
    if (distinct(this.attributes[name], value)) {
      if (value === undefined) {
        delete this.attributes[name];
      } else {
        this.attributes[name] = value;
      }
      if (!options?.silent) {
        this.listeners.get(name)?.forEach(cb => cb(name, value));
      }
      return true;
    }
    return false;
  }

  /**
   * @param name The attribute name.
   * @param callback The function to call when the attribute changes.
   */
  addAttributeListener(name: AttrName, callback: AttrCallback): this {
    const map = this.listeners;
    if (!map.has(name)) map.set(name, new Set);
    map.get(name).add(callback);
    return this;
  }

  /**
   * @param name The attribute name.
   * @param callback The function to call when the attribute changes.
   */
  removeAttributeListener(name: AttrName, callback: AttrCallback): boolean | undefined {
    return this.listeners.get(name)?.delete(callback);
  }

  addParams(mark: Mark, paramSet: Iterable<mc.Param<any>>): void {
    const { params } = this;
    for (const param of paramSet) {
      if (params.has(param)) {
        params.get(param).push(mark);
      } else {
        params.set(param, [mark]);
        param.addEventListener('value', () => {
          return Promise.allSettled(
            params.get(param).map(mark => mark.initialize())
          );
        });
      }
    }
  }

  addMark(mark: Mark): this {
    // determine index for annotating marks
    // we use this to match marks with SVG output
    // skip all guides (axis, grid, frame, etc)
    const idx = guideMarks.has(mark.type)
      ? -1
      : this.marks.reduce((sum, mark) => sum + (guideMarks.has(mark.type) ? 0 : 1), 0);
    mark.setPlot(this, idx);
    this.marks.push(mark);
    this.markset = null;
    return this;
  }

  get markSet(): Set<Mark> {
    return this.markset || (this.markset = new Set(this.marks));
  }


  addInteractor(sel: Interactor): this {
    this.interactors.push(sel);
    return this;
  }

  addLegend(legend: Legend, include: boolean = true): void {
    legend.setPlot(this);
    this.legends.push({ legend, include });
  }
}

function maybeAspectRatio(plot: Plot, top: number, bottom: number): number | undefined {
  const ar = plot.getAttribute('aspectRatio');
  if (ar == null) return;
  const x = plot.getAttribute('xDomain');
  const y = plot.getAttribute('yDomain');
  if (!x || !y) return;
  const dx = Math.abs(x[1] - x[0]);
  const dy = Math.abs(y[1] - y[0]);
  return dy * plot.innerWidth() / (ar * dx) + top + bottom;
}
