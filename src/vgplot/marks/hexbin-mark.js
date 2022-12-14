import { Mark } from '../mark.js';

export class HexbinMark extends Mark {
  constructor(source, options) {
    const { binWidth = 20, ...channels } = options;
    super('hexagon', source, { r: binWidth / 2, clip: true, ...channels });
    this.binWidth = binWidth;
  }

  data(data) {
    this._data = data;
    this.plot.setAttribute('scaleX', 'identity');
    this.plot.setAttribute('scaleY', 'identity');
    return this;
  }

  query() {
    const { binWidth, plot } = this;
    const q = super.query();
    const xdom = extentX(this);
    const ydom = extentY(this);

    const { select } = q;
    select.xy = {
      transform: 'hexbin',
      x: select.x.field,
      y: select.y.field,
      options: {
        binWidth,
        domainX: xdom,
        domainY: ydom,
        width: plot.innerWidth(),
        height: plot.innerHeight()
      }
    };
    delete select.x;
    delete select.y;

    return q;
  }
}

function extentX(mark) {
  const { plot, _stats } = mark;
  const domain = plot.getAttribute('domainX');

  if (Array.isArray(domain)) {
    return domain;
  } else {
    const field = mark.channelField('x');
    const { min, max } = _stats.find(s => s.field === field);
    return [min, max];
  }
}

function extentY(mark) {
  const { plot, _stats } = mark;
  const domain = plot.getAttribute('domainY');

  if (Array.isArray(domain)) {
    return domain;
  } else {
    const field = mark.channelField('y');
    const { min, max } = _stats.find(s => s.field === field);
    return [min, max];
  }
}
