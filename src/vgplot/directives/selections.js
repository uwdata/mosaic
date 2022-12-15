import { Highlight } from '../selections/Highlight.js';
import { PointSelection } from '../selections/Point.js';
import { Interval1DSelection } from '../selections/Interval1D.js';
import { Interval2DSelection } from '../selections/Interval2D.js';

function point(signal, channels) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addSelection(new PointSelection(mark, signal, channels));
  };
}

export function select({ as, channels }) {
  return point(as, channels);
}

export function selectX({ as }) {
  return point(as, ['x']);
}

export function selectY({ as }) {
  return point(as, ['y']);
}

export function selectColor({ as }) {
  return point(as, ['color']);
}

function interval1d(channel, signal, field) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addSelection(new Interval1DSelection(mark, channel, signal, field));
  };
}

function interval2d(signal, xfield, yfield) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addSelection(new Interval2DSelection(mark, signal, xfield, yfield));
  };
}

export function intervalX({ as, field }) {
  return interval1d('x', as, field);
}

export function intervalY({ as, field }) {
  return interval1d('y', as, field);
}

export function intervalXY({ as, xfield, yfield }) {
  return interval2d(as, xfield, yfield);
}

export function highlight(signal, channels) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addSelection(new Highlight(mark, signal, channels));
  };
}
