import { plotRenderer } from './plot-renderer.js';

const DEFAULT_ATTRIBUTES = {
  width: 640,
  marginLeft: 50,
  marginRight: 20,
  marginTop: 30,
  marginBottom: 30
};

export class Plot {
  constructor(element) {
    this.attributes = { ...DEFAULT_ATTRIBUTES };
    this.selections = [];
    this.legends = [];
    this.marks = [];
    this.markset = null;
    this.element = element || document.createElement('div');
    this.element.setAttribute('class', 'plot');
    this.element.value = this;
    this.queue = new Set;
  }

  margins() {
    return {
      left: this.getAttribute('marginLeft'),
      top: this.getAttribute('marginTop'),
      bottom: this.getAttribute('marginBottom'),
      right: this.getAttribute('marginRight')
    };
  }

  innerWidth() {
    const { left, right } = this.margins();
    return this.getAttribute('width') - left - right;
  }

  innerHeight() {
    const { top, bottom } = this.margins();
    return this.getAttribute('height') - top - bottom;
  }

  pending(mark) {
    this.queue.add(mark);
  }

  update(mark) {
    this.queue.delete(mark);
    if (this.queue.size === 0 && !this.pendingRender) {
      this.pendingRender = true;
      requestAnimationFrame(() => this.render());
    }
    return this;
  }

  async render() {
    this.pendingRender = false;
    const svg = await plotRenderer(this);
    this.element.replaceChildren(svg, ...this.legends.map(l => l.init(svg)));
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  setAttribute(name, value) {
    if (value === undefined) {
      delete this.attributes[name];
    } else {
      this.attributes[name] = value;
    }
    return this;
  }

  addMark(mark) {
    mark.plot = this;
    mark.index = this.marks.length;
    this.marks.push(mark);
    this.markset = null;
    return this;
  }

  get markSet() {
    return this.markset || (this.markset = new Set(this.marks));
  }

  addLegend(legend) {
    this.legends.push(legend);
  }

  addSelection(sel) {
    this.selections.push(sel);
    return this;
  }
}
