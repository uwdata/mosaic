export function over(expr, window = {}) {
  if (typeof window === 'object') {
    const { group, order, frame } = window;

    let frameSpec = '';
    if (frame) {
      const f0 = frameValue(frame[0], 0);
      const f1 = frameValue(frame[1], 1);
      frameSpec = `${type} BETWEEN ${f0} AND ${f1}`;
    }

    window = '(' + [
      ...(group ? [`PARTITION BY ${group}`] : []),
      ...(order ? [`ORDER BY ${order}`] : []),
      ...(frameSpec ? [frameSpec] : [])
    ].join(' ') + ')';
  }
  return `${expr} OVER ${window}`;
}

function frameValue(v, idx) {
  return v === 0
    ? 'CURRENT ROW'
    : (!v ? 'UNBOUNDED' : v) + (idx ? ' FOLLOWING' : ' PRECEDING');
}
