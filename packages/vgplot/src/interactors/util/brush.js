import {
  brush as d3_brush, brushX as d3_brushX, brushY as d3_brushY
} from 'd3';

function wrap(brush) {
  const addEventListener = brush.on;
  brush._enabled = true;
  brush.reset = group => {
    brush._enabled = false;
    brush.clear(group);
    brush._enabled = true;
  };
  brush.on = (type, callback) => {
    const f = (...args) => brush._enabled && callback(...args);
    return addEventListener(type, f);
  };
  return brush;
}

export function brush() {
  return wrap(d3_brush());
}

export function brushX() {
  return wrap(d3_brushX());
}

export function brushY() {
  return wrap(d3_brushY());
}
