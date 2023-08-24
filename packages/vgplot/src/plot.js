import { coordinator, distinct, synchronizer, AsyncDispatch } from '@uwdata/mosaic-core';
import { plotRenderer } from './plot-renderer.js';

const DEFAULT_ATTRIBUTES = {
  width: 640,
  marginLeft: 40,
  marginRight: 20,
  marginTop: 20,
  marginBottom: 30
};

export class Plot extends AsyncDispatch {
  constructor(element) {
    super();

    this.attributes = { ...DEFAULT_ATTRIBUTES };
    this.listeners = null;
    this.interactors = [];
    this.legends = [];
    this.marks = [];
    this.markset = null;
    this.element = element || document.createElement('div');
    this.element.setAttribute('class', 'plot');
    this.element.style.display = 'flex';
    this.element.value = this;
    this.params = new Map;
    this.synch = synchronizer();
    this.status = 'idle';
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

  async connect() {
    this.updateStatus('pendingQuery');

    await Promise.all(this.marks.map(mark => coordinator().connect(mark)));
  }

  pending(mark) {
    if (this.status !== 'pendingQuery') this.updateStatus('pendingQuery');

    this.synch.pending(mark);
  }

  update(mark) {
    if (this.synch.ready(mark) && !this.pendingRender) {
      this.pendingRender = true;
      this.updateStatus('pendingRender');
      requestAnimationFrame(() => this.render());
    }
    return this.synch.promise;
  }

  async render() {
    this.pendingRender = false;
    const svg = await plotRenderer(this);
    const legends = this.legends.flatMap(({ legend, include }) => {
      const el = legend.init(svg);
      return include ? el : [];
    });
    this.element.replaceChildren(svg, ...legends);
    this.synch.resolve();
    this.updateStatus('idle');
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  setAttribute(name, value, options) {
    if (distinct(this.attributes[name], value)) {
      if (value === undefined) {
        delete this.attributes[name];
      } else {
        this.attributes[name] = value;
      }
      if (!options?.silent) {
        this.listeners?.get(name)?.forEach(cb => cb(name, value));
      }
      return true;
    }
    return false;
  }

  addAttributeListener(name, callback) {
    const map = this.listeners || (this.listeners = new Map);
    if (!map.has(name)) map.set(name, new Set);
    map.get(name).add(callback);
    return this;
  }

  removeAttributeListener(name, callback) {
    return this.listeners?.get(name)?.delete(callback);
  }

  addDirectives(directives) {
    directives.forEach(dir => dir(this));
  }

  addParams(mark, paramSet) {
    const { params } = this;
    for (const param of paramSet) {
      if (params.has(param)) {
        params.get(param).push(mark);
      } else {
        params.set(param, [mark]);
        param.addEventListener('value', () => {
          return Promise.allSettled(
            params.get(param).map(mark => mark.requestQuery())
          );
        });
      }
    }
  }

  addMark(mark) {
    mark.setPlot(this, this.marks.length);
    this.marks.push(mark);
    this.markset = null;
    return this;
  }

  get markSet() {
    return this.markset || (this.markset = new Set(this.marks));
  }

  addInteractor(sel) {
    this.interactors.push(sel);
    return this;
  }

  addLegend(legend, include = true) {
    legend.setPlot(this);
    this.legends.push({ legend, include });
  }

  updateStatus(status) {
    this.status = status;
    this.emit('status', this.status);
  }
}
