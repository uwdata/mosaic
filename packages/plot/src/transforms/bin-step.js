export function binStep(span, steps, minstep = 0, logb = Math.LN10) {
  let v;

  const level = Math.ceil(Math.log(steps) / logb);
  let step = Math.max(
    minstep,
    Math.pow(10, Math.round(Math.log(span) / logb) - level)
  );

  // increase step size if too many bins
  while (Math.ceil(span / step) > steps) { step *= 10; }

  // decrease step size if allowed
  const div = [5, 2];
  for (let i = 0, n = div.length; i < n; ++i) {
    v = step / div[i];
    if (v >= minstep && span / v <= steps) step = v;
  }

  return step;
}

export function bins(min, max, options) {
  let { step, steps, minstep = 0, nice = true } = options;

  if (nice !== false) {
    // use span to determine step size
    const span = max - min;
    const logb = Math.LN10;
    step = step || binStep(span, steps || 25, minstep, logb);

    // adjust min/max relative to step
    let v = Math.log(step);
    const precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
    const eps = Math.pow(10, -precision - 1);
    v = Math.floor(min / step + eps) * step;
    min = min < v ? v - step : v;
    max = Math.ceil(max / step) * step;
    steps = Math.round((max - min) / step);
  }

  return { min, max, steps };
}
