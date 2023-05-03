import {
  brush as d3_brush, brushX as d3_brushX, brushY as d3_brushY
} from 'd3';

function wrap(brush) {
  const brushOn = brush.on;
  let enabled = true;

  function silence(callback) {
    enabled = false;
    callback();
    enabled = true;
  }

  brush.reset = (...args) => {
    silence(() => brush.clear(...args));
  };

  brush.moveSilent = (...args) => {
    silence(() => brush.move(...args));
  };

  brush.on = (...args) => {
    if (args.length > 1 && args[1]) {
      // wrap callback to respect enabled flag
      const callback = args[1];
      args[1] = (...event) => enabled && callback(...event);
    }
    return brushOn(...args);
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
