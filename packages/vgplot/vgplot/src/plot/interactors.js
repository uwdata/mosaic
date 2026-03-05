import {
  Highlight,
  Interval1D,
  Interval2D,
  Nearest,
  PanZoom,
  Region,
  Toggle
} from '@uwdata/mosaic-plot';

function interactor(InteractorClass, options) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addInteractor(new InteractorClass(mark, options));
  };
}

export function highlight({ by, ...channels }) {
  return interactor(Highlight, { selection: by, channels });
}

export function intervalX({ as, ...rest }) {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'x' });
}

export function intervalY({ as, ...rest }) {
  return interactor(Interval1D, { ...rest, selection: as, channel: 'y' });
}

export function intervalXY({ as, ...rest }) {
  return interactor(Interval2D, { ...rest, selection: as });
}

export function nearest({ as, ...rest }) {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'xy' });
}

export function nearestX({ as, ...rest }) {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'x' });
}

export function nearestY({ as, ...rest }) {
  return interactor(Nearest, { ...rest, selection: as, pointer: 'y' });
}

export function region({ as, ...rest }) {
  return interactor(Region, { ...rest, selection: as });
}

export function toggle({ as, ...rest }) {
  return interactor(Toggle, { ...rest, selection: as });
}

export function toggleX(options) {
  return toggle({ ...options, channels: ['x'] });
}

export function toggleY(options) {
  return toggle({ ...options, channels: ['y'] });
}

export function toggleZ(options) {
  return toggle({ ...options, channels: ['z'] });
}

export function toggleColor(options) {
  return toggle({ ...options, channels: ['color'] });
}

function zoom(options) {
  return interactor(PanZoom, options);
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
