import { Highlight } from '../interactors/Highlight.js';
import { Toggle } from '../interactors/Toggle.js';
import { Interval1D } from '../interactors/Interval1D.js';
import { Interval2D } from '../interactors/Interval2D.js';
import { PanZoom } from '../interactors/PanZoom.js';
import { Nearest } from '../interactors/Nearest.js';

function interactor(InteractorClass, options) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addInteractor(new InteractorClass(mark, options));
  };
}

export function highlight({ by, ...channels }) {
  return interactor(Highlight, { selection: by, channels });
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

export function toggleColor(options) {
  return toggle({ ...options, channels: ['color'] });
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
