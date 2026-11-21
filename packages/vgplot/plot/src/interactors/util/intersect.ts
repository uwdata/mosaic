import { parsePath, type DrawingCommand } from './parse-path.js';

/**
 * Return SVG elements that intersect the provided spatial extent.
 * @param svg Parent SVG element to search within.
 * @param el SVG container element to search for points.
 * @param extent Rectangular brush
 *  extent within which to select elements. The extent is represented as
 *  upper-left and bottom-right (x, y) coordinates.
 * @returns A list of intersecting SVG elements.
 */
export function intersect(svg: SVGSVGElement, el: SVGElement, extent: [[number, number], [number, number]]): Element[] {
  // svg origin in viewport coordinates
  const { x, y } = svg.getBoundingClientRect();
  const identity = svg.createSVGMatrix();

  // collect elements that intersect the extent
  const list = [];
  for (const child of el.children) {
    if (child.tagName === 'g') {
      // handle faceted mark
      const matrix = getTransformMatrix(child as SVGGElement) ?? identity;
      for (const grandchild of child.children) {
        if (intersects(extent, x, y, grandchild, matrix)) {
          list.push(grandchild);
        }
      }
    } else if (intersects(extent, x, y, child, identity)) {
      list.push(child);
    }
  }
  return list;
}

function intersects(sel: [[number, number], [number, number]], ox: number, oy: number, el: Element, matrix: DOMMatrix): boolean {
  let [[l, t], [r, b]] = sel;

  // facet groups involve translation only
  const { e: tx, f: ty } = matrix;

  // getBoundingClientRect uses viewport coordinates
  // so we first translate to SVG coordinates
  const c = el.getBoundingClientRect();
  const cl = c.left - ox;
  const cr = c.right - ox;
  const ct = c.top - oy;
  const cb = c.bottom - oy;

  if (cl >= l && cr <= r && ct >= t && cb <= b) {
    // if selection encloses item bounds, we're done
    return true;
  } else if (cl <= r && cr >= l && ct <= b && cb >= t) {
    // if selection intersects item bounds, test further
    let tag = el.tagName;

    // if a hyperlink, use enclosed element
    if (tag === 'a') {
      el = el.children[0];
      tag = el.tagName;
    }

    // handle marks that rely solely on bbox intersection
    if (tag === 'rect' || tag === 'text' || tag === 'image') {
      return true;
    }

    // translate selection relative to enclosing group
    l -= tx;
    t -= ty;
    r -= tx;
    b -= ty;

    switch (tag) {
      case 'circle': {
        const circle = el as SVGCircleElement;
        return intersectCircle(l, t, r, b, $(circle.cx), $(circle.cy), $(circle.r));
      }
      case 'line': {
        const line = el as SVGLineElement;
        return intersectLine(l, t, r, b, $(line.x1), $(line.y1), $(line.x2), $(line.y2));
      }
      case 'path':
        return intersectPath(l, t, r, b, el as SVGGElement);
    }
  }
  return false;
}

function $<R>(attr: { baseVal: { value: R; }; }): R {
  return attr.baseVal.value;
}

function getTransformMatrix(el: SVGGElement): DOMMatrix {
  const transform = el.transform.baseVal;
  const n = transform.length;
  let m = transform[0]?.matrix;
  for (let i = 1; i < n; ++i) {
    m = m.multiply(transform[i].matrix);
  }
  return m;
}

function intersectCircle(l: number, t: number, r: number, b: number, cx: number, cy: number, cr: number): boolean {
  const h = l <= cx && cx <= r;
  const v = t <= cy && cy <= b;
  if (h && v) return true; // center is enclosed

  const dx = Math.min(Math.abs(l - cx), Math.abs(r - cx));
  if (v && dx <= cr) return true;

  const dy = Math.min(Math.abs(t - cy), Math.abs(b - cy));
  return (h && dy <= cr) || (dx * dx + dy * dy <= cr * cr);
}

function intersectLine(l: number, t: number, r: number, b: number, x1: number, y1: number, x2: number, y2: number): boolean {
  const xmin = Math.max(Math.min(x1, x2), l);
  const xmax = Math.min(Math.max(x1, x2), r);
  if (xmin > xmax) return false;
  let yl1 = y1;
  let yl2 = y2;
  const dx = x2 - x1;
  if (Math.abs(dx) > 1e-8) {
    const a = (y2 - y1) / dx;
    const b = y1 - a * x1;
    yl1 = a * xmin + b;
    yl2 = a * xmax + b;
  }
  const ymin = Math.max(Math.min(yl1, yl2), t);
  const ymax = Math.min(Math.max(yl1, yl2), b);
  return ymin <= ymax;
}

export function intersectPath(l: number, t: number, r: number, b: number, el: SVGGElement & { __path__?: DrawingCommand[]; }): boolean {
  // parse path and cache result for reuse
  const cmds = el.__path__ || (el.__path__ = parsePath(el.getAttribute('d')));

  let anchorX = 0;
  let anchorY = 0;
  let x = 0;
  let y = 0;
  let hit = false;
  const poly = [0, 0];
  let n = 2;

  const matrix = getTransformMatrix(el);

  const setAnchor = (ax: number, ay: number) => {
    poly.length = n = 2;
    poly[0] = x = anchorX = ax;
    poly[1] = y = anchorY = ay;
  };

  const anchor = matrix
    ? (x: number, y: number) => setAnchor(multiplyX(matrix, x, y), multiplyY(matrix, x, y))
    : (x: number, y: number) => setAnchor(x, y);

  const test = (x2: number, y2: number) => {
    poly[n] = x2;
    poly[n + 1] = y2;
    n += 2;
    return intersectLine(l, t, r, b, poly[n - 4], poly[n - 3], x2, y2);
  };

  const lineTo = matrix
    ? (x2: number, y2: number) => {
      hit = test(
        multiplyX(matrix, x = x2, y = y2),
        multiplyY(matrix, x2, y2)
      );
    }
    : (x2: number, y2: number) => { hit = test(x = x2, y = y2); };

  for (let i = 0; i < cmds.length; ++i) {
    const cmd = cmds[i];
    switch (cmd[0]) {
      case 'M': anchor(cmd[1], cmd[2]); break;
      case 'm': anchor(x + cmd[1], y + cmd[2]); break;
      case 'L':
      case 'T': lineTo(cmd[1], cmd[2]); break;
      case 'H': lineTo(cmd[1], y); break;
      case 'V': lineTo(x, cmd[1]); break;
      case 'l':
      case 't': lineTo(x + cmd[1], y + cmd[2]); break;
      case 'h': lineTo(x + cmd[1], y); break;
      case 'v': lineTo(x, y + cmd[1]); break;

      // approximate bezier curve as line for now
      case 'C': lineTo(cmd[5], cmd[6]); break;
      case 'c': lineTo(x + cmd[5], y + cmd[6]); break;
      case 'S':
      case 'Q': lineTo(cmd[3], cmd[4]); break;
      case 's':
      case 'q': lineTo(x + cmd[3], y + cmd[4]); break;

      // we don't expect to see arcs other than geo point circles
      // but just in case, approximate via straight line for now
      case 'A': lineTo(cmd[6], cmd[7]); break;
      case 'a':
        if (isCircle(cmds, i)) {
          // special case for geo point circle
          return intersectCircle(l, t, r, b, x, y - cmd[2], cmd[2]);
        } else {
          lineTo(x + cmd[6], x + cmd[7]);
        }
        break;

      case 'z':
      case 'Z':
        lineTo(anchorX, anchorY);
        if (pointInPolygon(l, t, poly) > 0) return true;
        anchor(anchorX, anchorY);
        break;
      default:
        // bail for now
        console.warn('SVG path command not supported: ', cmd[0]);
        return false;
    }
    if (hit) return true;
  }
  return false;
}

function multiplyX(m: DOMMatrix, x: number, y: number): number {
  return m.a * x + m.c * y + m.e;
}

function multiplyY(m: DOMMatrix, x: number, y: number): number {
  return m.b * x + m.d * y + m.f;
}

function isCircle(cmds: DrawingCommand[], i: number): boolean {
  const a = cmds[i];
  const b = cmds[i + 1];
  return b && b[0] === 'a'
    && cmds[i + 2]?.[0] === 'z'
    && a[1] === a[2]
    && b[1] === b[2]
    && a[1] === b[1]
    && a[7] === -b[7];
}

/**
 * Point in polygon test, based on Dan Sunday's winding number algorithm.
 * https://web.archive.org/web/20130126163405/http://geomalgorithms.com/a03-_inclusion.html
 * @param x The x-coordinate to test for inclusion
 * @param y The y-coordinate to test for inclusion
 * @param poly Polygon vertices as a flat array of numbers
 * @returns The winding number. Non-zero values indicate inclusion.
 */
function pointInPolygon(x: number, y: number, poly: number[]): number {
  let wn = 0;
  const n = poly.length - 2;

  for (let i = 0; i < n; i += 2) {
    if (poly[i + 1] <= y) {
      // an upward crossing and (x,y) left of edge
      if (poly[i + 3] > y && isLeft(x, y, poly, i) > 0)
        ++wn; // valid up intersect
    }
    // a downward crossing and (x,y) right of edge
    // @ts-expect-error `poly[i]` passes a number, which shouldn't be indexed?
    else if (poly[i + 3] <= y && isLeft(x, y, poly[i]) < 0) {
      --wn; // valid down intersect
    }
  }

  return wn;
}

function isLeft(x: number, y: number, p: number[], i?: number): number {
  return (p[i + 2] - p[i]) * (y - p[i + 1]) - (x - p[i]) * (p[i + 3] - p[i + 1]);
}