import { brush as d3_brush, brushX as d3_brushX, brushY as d3_brushY, select } from 'd3';
import { patchScreenCTM } from './patchScreenCTM.js';

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

export function brushGroups(svg, root, dx, dy, className) {
  let groups = select(root ?? svg)
    .append('g')
    .attr('class', className)

  // if the plot is faceted, create per-facet brush groups
  const fx = svg.scale('fx');
  const fy = svg.scale('fy');
  if (fx || fy) {
    const X = fx?.domain.map(v => fx.apply(v) - dx);
    const Y = fy?.domain.map(v => fy.apply(v) - dy);
    if (X && Y) {
      for (let i = 0; i < X.length; ++i) {
        for (let j = 0; j < Y.length; ++j) {
          groups.append('g').attr('transform', `translate(${X[i]}, ${Y[j]})`);
        }
      }
    } else if (X) {
      for (let i = 0; i < X.length; ++i) {
        groups.append('g').attr('transform', `translate(${X[i]}, 0})`);
      }
    } else if (Y) {
      for (let j = 0; j < Y.length; ++j) {
        groups.append('g').attr('transform', `translate(0, ${Y[j]})`);
      }
    }
    groups = groups.selectAll('g');
  }

  // return brush groups, with screen transform fix
  return groups.each(patchScreenCTM);
}
