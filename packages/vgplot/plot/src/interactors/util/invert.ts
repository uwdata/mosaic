export function invert(value, scale, pixelSize = 1) {
  return scale.invert(pixelSize * Math.floor(value / pixelSize));
}
