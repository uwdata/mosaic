import { Interval1DSelection } from '../selections/Interval1D.js';
import { Interval2DSelection } from '../selections/Interval2D.js';

function interval1d(channel, signal) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addSelection(new Interval1DSelection(mark, channel, signal));
  };
}

function interval2d(signal) {
  return plot => {
    const mark = plot.marks[plot.marks.length - 1];
    plot.addSelection(new Interval2DSelection(mark, signal));
  };
}

export function intervalX({ as }) {
  return interval1d('x', as);
}

export function intervalY({ as }) {
  return interval1d('y', as);
}

export function intervalXY({ as }) {
  return interval2d(as);
}
