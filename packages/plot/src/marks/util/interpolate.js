import { Delaunay, randomLcg } from 'd3';

export function interpolatorBarycentric({random = randomLcg(42)} = {}) {
  return (index, width, height, X, Y, V, W) => {
    // Interpolate the interior of all triangles with barycentric coordinates
    const {points, triangles, hull} = Delaunay.from(index, (i) => X[i], (i) => Y[i]);
    const S = new Uint8Array(width * height); // 1 if pixel has been seen.
    const mix = mixer(V, random);

    for (let i = 0; i < triangles.length; i += 3) {
      const ta = triangles[i];
      const tb = triangles[i + 1];
      const tc = triangles[i + 2];
      const Ax = points[2 * ta];
      const Bx = points[2 * tb];
      const Cx = points[2 * tc];
      const Ay = points[2 * ta + 1];
      const By = points[2 * tb + 1];
      const Cy = points[2 * tc + 1];
      const x1 = Math.min(Ax, Bx, Cx);
      const x2 = Math.max(Ax, Bx, Cx);
      const y1 = Math.min(Ay, By, Cy);
      const y2 = Math.max(Ay, By, Cy);
      const z = (By - Cy) * (Ax - Cx) + (Ay - Cy) * (Cx - Bx);
      if (!z) continue;
      const va = V[index[ta]];
      const vb = V[index[tb]];
      const vc = V[index[tc]];
      for (let x = Math.floor(x1); x < x2; ++x) {
        for (let y = Math.floor(y1); y < y2; ++y) {
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const xp = x + 0.5; // sample pixel centroids
          const yp = y + 0.5;
          const ga = ((By - Cy) * (xp - Cx) + (yp - Cy) * (Cx - Bx)) / z;
          if (ga < 0) continue;
          const gb = ((Cy - Ay) * (xp - Cx) + (yp - Cy) * (Ax - Cx)) / z;
          if (gb < 0) continue;
          const gc = 1 - ga - gb;
          if (gc < 0) continue;
          const i = x + width * y;
          W[i] = mix(va, ga, vb, gb, vc, gc, x, y);
          S[i] = 1;
        }
      }
    }
    extrapolateBarycentric(W, S, X, Y, V, width, height, hull, index, mix);
    return W;
  };
}

// Extrapolate by finding the closest point on the hull.
function extrapolateBarycentric(W, S, X, Y, V, width, height, hull, index, mix) {
  X = Float64Array.from(hull, (i) => X[index[i]]);
  Y = Float64Array.from(hull, (i) => Y[index[i]]);
  V = Array.from(hull, (i) => V[index[i]]);
  const n = X.length;
  const rays = Array.from({length: n}, (_, j) => ray(j, X, Y));
  let k = 0;
  for (let y = 0; y < height; ++y) {
    const yp = y + 0.5;
    for (let x = 0; x < width; ++x) {
      const i = x + width * y;
      if (!S[i]) {
        const xp = x + 0.5;
        for (let l = 0; l < n; ++l) {
          const j = (n + k + (l % 2 ? (l + 1) / 2 : -l / 2)) % n;
          if (rays[j](xp, yp)) {
            const t = segmentProject(X.at(j - 1), Y.at(j - 1), X[j], Y[j], xp, yp);
            W[i] = mix(V.at(j - 1), t, V[j], 1 - t, V[j], 0, x, y);
            k = j;
            break;
          }
        }
      }
    }
  }
}

// Projects a point p = [x, y] onto the line segment [p1, p2], returning the
// projected coordinates p’ as t in [0, 1] with p’ = t p1 + (1 - t) p2.
function segmentProject(x1, y1, x2, y2, x, y) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const a = dx * (x2 - x) + dy * (y2 - y);
  const b = dx * (x - x1) + dy * (y - y1);
  return a > 0 && b > 0 ? a / (a + b) : +(a > b);
}

function cross(xa, ya, xb, yb) {
  return xa * yb - xb * ya;
}

function ray(j, X, Y) {
  const n = X.length;
  const xc = X.at(j - 2);
  const yc = Y.at(j - 2);
  const xa = X.at(j - 1);
  const ya = Y.at(j - 1);
  const xb = X[j];
  const yb = Y[j];
  const xd = X.at(j + 1 - n);
  const yd = Y.at(j + 1 - n);
  const dxab = xa - xb;
  const dyab = ya - yb;
  const dxca = xc - xa;
  const dyca = yc - ya;
  const dxbd = xb - xd;
  const dybd = yb - yd;
  const hab = Math.hypot(dxab, dyab);
  const hca = Math.hypot(dxca, dyca);
  const hbd = Math.hypot(dxbd, dybd);
  return (x, y) => {
    const dxa = x - xa;
    const dya = y - ya;
    const dxb = x - xb;
    const dyb = y - yb;
    return (
      cross(dxa, dya, dxb, dyb) > -1e-6 &&
      cross(dxa, dya, dxab, dyab) * hca - cross(dxa, dya, dxca, dyca) * hab > -1e-6 &&
      cross(dxb, dyb, dxbd, dybd) * hab - cross(dxb, dyb, dxab, dyab) * hbd <= 0
    );
  };
}

export function interpolateNearest(index, width, height, X, Y, V, W) {
  const delaunay = Delaunay.from(index, (i) => X[i], (i) => Y[i]);
  // memoization of delaunay.find for the line start (iy) and pixel (ix)
  let iy, ix;
  for (let y = 0.5, k = 0; y < height; ++y) {
    ix = iy;
    for (let x = 0.5; x < width; ++x, ++k) {
      ix = delaunay.find(x, y, ix);
      if (x === 0.5) iy = ix;
      W[k] = V[index[ix]];
    }
  }
  return W;
}

// https://observablehq.com/@observablehq/walk-on-spheres-precision
export function interpolatorRandomWalk({random = randomLcg(42), minDistance = 0.5, maxSteps = 2} = {}) {
  return (index, width, height, X, Y, V, W) => {
    const delaunay = Delaunay.from(index, (i) => X[i], (i) => Y[i]);
    // memoization of delaunay.find for the line start (iy), pixel (ix), and wos step (iw)
    let iy, ix, iw;
    for (let y = 0.5, k = 0; y < height; ++y) {
      ix = iy;
      for (let x = 0.5; x < width; ++x, ++k) {
        let cx = x;
        let cy = y;
        iw = ix = delaunay.find(cx, cy, ix);
        if (x === 0.5) iy = ix;
        let distance; // distance to closest sample
        let step = 0; // count of steps for this walk
        while ((distance = Math.hypot(X[index[iw]] - cx, Y[index[iw]] - cy)) > minDistance && step < maxSteps) {
          const angle = random(x, y, step) * 2 * Math.PI;
          cx += Math.cos(angle) * distance;
          cy += Math.sin(angle) * distance;
          iw = delaunay.find(cx, cy, iw);
          ++step;
        }
        W[k] = V[index[iw]];
      }
    }
    return W;
  };
}

function blend(a, ca, b, cb, c, cc) {
  return ca * a + cb * b + cc * c;
}

function pick(random) {
  return (a, ca, b, cb, c, cc, x, y) => {
    const u = random(x, y);
    return u < ca ? a : u < ca + cb ? b : c;
  };
}

function mixer(F, random) {
  return isNumeric(F) || isTemporal(F) ? blend : pick(random);
}

function isNumeric(values) {
  for (const value of values) {
    if (value == null) continue;
    return typeof value === "number";
  }
}

function isTemporal(values) {
  for (const value of values) {
    if (value == null) continue;
    return value instanceof Date;
  }
}
