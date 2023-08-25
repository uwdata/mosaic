import { Highlight } from '../interactors/Highlight.js';
import { Toggle } from '../interactors/Toggle.js';
import { Interval1D } from '../interactors/Interval1D.js';
import { Interval2D } from '../interactors/Interval2D.js';
import { PanZoom } from '../interactors/PanZoom.js';
import { Nearest } from '../interactors/Nearest.js';

function interactor(InteractorClass, options) {
  return plot => {
    const mark = findMark(plot.marks, options.index);
    plot.addInteractor(new InteractorClass(mark, options));
  };
}

function findMark(marks, index) {
  const mark = marks[index ?? marks.length - 1];

  if (!mark) throw new Error(`Mark not found with index ${index}.`);

  return mark;
}

export function highlight({ by, index, ...channels }) {
  return interactor(Highlight, { selection: by, index, channels });
}

export function toggle({ as, ...rest }) {
  return interactor(Toggle, { selection: as, ...rest });
}

export function toggleX({ as, index }) {
  return toggle({ as, index, channels: ['x'] });
}

export function toggleY({ as, index }) {
  return toggle({ as, index, channels: ['y'] });
}

export function toggleColor({ as, index }) {
  return toggle({ as, index, channels: ['color'] });
}

export function nearestX({ as, ...rest }) {
  return interactor(Nearest, { ...rest, selection: as, channel: 'x' });
}

export function nearestY({ as, ...rest }) {
  return interactor(Nearest, { ...rest, selection: as, channel: 'y' });
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
