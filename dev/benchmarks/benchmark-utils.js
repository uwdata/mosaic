import { plot } from '../../packages/vgplot/dist/vgplot.js';

let abort = false;
let results = [];
let renderCount;
let renderDone;

export function watchRender(count, done) {
  renderCount = count;
  renderDone = done;
}

export function mplot(...args) {
  const p = plot(...args);
  const oldRender = p.value.render;
  p.value.render = async function() {
    await oldRender.call(p.value);
    performance.mark('plot-render');
    onRender(p);
  };
  return p;
}

function onRender() {
  if (renderDone) {
    if (--renderCount === 0) {
      const done = renderDone;
      renderDone = null;
      done();
    }
  }
}

export async function run(tasks) {
  measureInit();
  for (const task of tasks) {
    if (!abort) await task();
  }

  const data = results;
  results = [];
  abort = false;

  console.log('CLIENT', stats(data.filter(x => x.type === 'client')).max);
  console.log('INIT', stats(data.filter(x => x.type === 'init')).max);
  console.log('UPDATE', stats(data.filter(x => x.type === 'update')));
  return (self.results = data);
}

export function stop() {
  abort = true;
}

export function startClient() {
  performance.mark('benchmark-client');
}

export function startInit() {
  performance.mark('benchmark-init');
}

export function startUpdate() {
  performance.mark('benchmark-update');
}

export function measureClient(props = {}) {
  performance.mark('benchmark-client-loaded');
  const p = performance.measure('client-time', 'benchmark-client', 'benchmark-client-loaded');
  results.push({ type: 'client', time: p.duration, ...props });
}

export function measureInit(props = {}) {
  const p = performance.measure('init-time', 'benchmark-init', 'plot-render');
  results.push({ type: 'init', time: p.duration, ...props });
}

export function measureUpdate(props = {}) {
  const p = performance.measure('update-time', 'benchmark-update', 'plot-render');
  results.push({ type: 'update', time: p.duration, ...props });
}

function updateInterval(interval, renderCount) {
  return (range, props) => () => new Promise(resolve => {
    watchRender(renderCount, () => { resolve(measureUpdate(props)); });
    startUpdate();
    interval.publish(range);
  });
}

export function growInterval1D(interval, renderCount) {
  const updater = updateInterval(interval, renderCount);
  const tasks = [];
  const { range } = interval.scale;
  const [lo, hi] = range;
  const extent = Math.floor(hi - lo);
  for (let index = 0; index < extent; ++index) {
    tasks.push(updater([lo, lo + index], { index }));
  }
  for (let index = 0; index < extent; ++index) {
    tasks.push(updater([lo, hi - index], { index: extent - index }));
  }
  tasks.push(updater(null, { index: -1 })); // clear
  return tasks;
}

export function slideInterval1D(interval, renderCount) {
  const updater = updateInterval(interval, renderCount);
  const tasks = [];
  const { range } = interval.scale;
  const [lo, hi] = range;
  const extent = hi - lo;
  [0.05, 0.10, 0.20].forEach(perc => {
    const w = Math.round(perc * extent);
    for (let index = 0; index < extent - w; ++index) {
      tasks.push(updater([lo + index, lo + index + w], { perc, index }));
    }
    tasks.push(updater(null, { perc: 1, index: -1 })); // clear
  });
  return tasks;
}

export function stats(results) {
  const t = Float64Array.from(results.map(r => r.time));
  const n = t.length;
  t.sort((a, b) => a - b);
  let sum = 0;
  for (let i = 0; i < n; ++i) {
    sum += t[i];
  }
  return {
    fps: 1000 * (n / sum),
    avg: sum / n,
    min: t[0],
    q01: quantileSorted(t, 0.01),
    q05: quantileSorted(t, 0.05),
    q25: quantileSorted(t, 0.25),
    q50: quantileSorted(t, 0.50),
    q75: quantileSorted(t, 0.75),
    q95: quantileSorted(t, 0.95),
    q99: quantileSorted(t, 0.99),
    max: t[t.length - 1]
  };
}

function quantileSorted(values, p) {
  if (!(n = values.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return values[0];
  if (p >= 1) return values[n - 1];
  var n,
      i = (n - 1) * p,
      i0 = Math.floor(i),
      value0 = values[i0],
      value1 = values[i0 + 1];
  return value0 + (value1 - value0) * (i - i0);
}
