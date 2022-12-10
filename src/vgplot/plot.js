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
    this.marks = [];
    this.element = element || document.createElement('div');
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

  pending(mark) {
    this.queue.add(mark);
  }

  update(mark) {
    this.queue.delete(mark);
    if (this.queue.size === 0) {
      this.render();
    }
    return this;
  }

  render() {
    this.element.replaceChildren(plotRenderer(this));
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  addMark(mark) {
    mark.plot = this;
    this.marks.push(mark);
  }

  addSelection(sel) {
    this.selections.push(sel);
  }
}
