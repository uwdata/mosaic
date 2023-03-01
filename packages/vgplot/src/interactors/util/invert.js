export function invert(value, scale, resolution = 1) {
  return scale.invert(resolution * Math.floor(value / resolution));
}
