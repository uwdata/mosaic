import { brush as d3_brush, brushX as d3_brushX, brushY as d3_brushY, select, type BrushBehavior, type Selection as d3_Selection } from 'd3';
import { patchScreenCTM } from './patchScreenCTM.js';
import type { SVG } from '../../types.js';

export type WrapBrush = BrushBehavior<unknown> & { reset: (...args: any[]) => void, moveSilent: (...args: any[]) => void; };

function wrap(brush: BrushBehavior<unknown>): WrapBrush {
  const brushOn = brush.on;
  let enabled = true;

  function silence(callback: () => void): void {
    enabled = false;
    callback();
    enabled = true;
  }

  //@ts-expect-error monkeypatching
  brush.reset = (...args: any[]): void => {
    //@ts-expect-error A spread argument must either have a tuple type or be passed to a rest parameter.
    silence(() => brush.clear(...args));
  };

  //@ts-expect-error monkeypatching
  brush.moveSilent = (...args: any[]): void => {
    //@ts-expect-error A spread argument must either have a tuple type or be passed to a rest parameter.
    silence(() => brush.move(...args));
  };

  brush.on = (...args: any[]) => {
    if (args.length > 1 && args[1]) {
      // wrap callback to respect enabled flag
      const callback = args[1];
      args[1] = (...event: any[]) => enabled && callback(...event);
    }
    //@ts-expect-error A spread argument must either have a tuple type or be passed to a rest parameter.
    return brushOn(...args);
  };

  return brush as WrapBrush;
}

export function brush(): WrapBrush {
  return wrap(d3_brush());
}

export function brushX(): WrapBrush {
  return wrap(d3_brushX());
}

export function brushY(): WrapBrush {
  return wrap(d3_brushY());
}

export function brushGroups(svg: SVG, root: SVGGElement | undefined | null, dx: number, dy: number, className: string) {
  let groups: d3_Selection<SVGGElement, unknown, SVGGElement | null, undefined> = select(root ?? svg)
    .append('g')
    .attr('class', className);

  // if the plot is faceted, create per-facet brush groups
  const fx = svg.scale('fx');
  const fy = svg.scale('fy');
  if (fx || fy) {
    //@ts-expect-error roperty 'map' does not exist on type 'Iterable<any>'.
    const X = fx?.domain.map(v => fx.apply(v) - dx);
    //@ts-expect-error roperty 'map' does not exist on type 'Iterable<any>'.
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
