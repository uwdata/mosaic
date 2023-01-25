import { Highlight } from '../selections/Highlight.js';
import { PointSelection } from '../selections/Point.js';
import { Interval1DSelection } from '../selections/Interval1D.js';
import { Interval2DSelection } from '../selections/Interval2D.js';
import { PanZoomSelection } from '../selections/PanZoom.js';

function selection(SelectionClass, options) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addSelection(new SelectionClass(mark, options));
  };
}

export function highlight({ by, ...rest }) {
  return selection(Highlight, { selection: by, channels: rest });
}

export function select({ as, ...rest }) {
  return selection(PointSelection, { ...rest, selection: as });
}

export function selectX({ as }) {
  return select({ as, channels: ['x'] });
}

export function selectY({ as }) {
  return select({ as, channels: ['y'] });
}

export function selectColor({ as }) {
  return select({ as, channels: ['color'] });
}

export function intervalX({ as, ...rest }) {
  return selection(Interval1DSelection, { ...rest, selection: as, channel: 'x' });
}

export function intervalY({ as, ...rest }) {
  return selection(Interval1DSelection, { ...rest, selection: as, channel: 'y' });
}

export function intervalXY({ as, ...rest }) {
  return selection(Interval2DSelection, { ...rest, selection: as });
}

function zoom(options) {
  return selection(PanZoomSelection, options);
}

export function pan(options = {}) {
  return zoom({ ...options, zoom: false });
}

export function panX(options = {}) {
  return zoom({ ...options, zoom: false, pany: false });
}

export function panY(options = {}) {
  return zoom({ ...options, zoom: false, panx: false });
}

export function panZoom(options = {}) {
  return zoom(options);
}

export function panZoomX(options = {}) {
  return zoom({ ...options, pany: false });
}

export function panZoomY(options = {}) {
  return zoom({ ...options, panx: false });
}
