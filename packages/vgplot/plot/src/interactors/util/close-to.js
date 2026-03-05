const EPS = 1e-12;

export function closeTo(a, b) {
  return a === b || (
    a && b &&
    Math.abs(a[0] - b[0]) < EPS &&
    Math.abs(a[1] - b[1]) < EPS
  ) || false;
}
