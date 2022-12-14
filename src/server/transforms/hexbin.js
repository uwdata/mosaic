import { from, isNotNull } from '../../query/index.js';

export default function(q, sql, select, key, spec) {
  const {
    x,
    y,
    options: { binWidth = 20, domainX, domainY, width, height }
  } = spec;

  const ox = 0.5;
  const oy = 0;
  const dx = binWidth;
  const dy = dx * (1.5 / Math.sqrt(3));
  const [x1, x2] = domainX;
  const [y1, y2] = domainY;
  const xspan = x2 - x1;
  const yspan = y2 - y1;
  const xx = `${width} * (${x} - ${x1}) / ${xspan}`;
  const yy = `${height} * (${y2} - ${y}) / ${yspan}`;

  // TODO add groupby dims
  const subsel = {
    py: `(${yy} - ${oy}) / ${dy}`,
    pj: `ROUND(py)::INTEGER`,
    px: `(${xx} - ${ox}) / ${dx} - 0.5 * (pj & 1)`,
    pi: `ROUND(px)::INTEGER`,
    [key]: `CASE
    WHEN ABS(py-pj) * 3 > 1 AND (px-pi)**2 + (py-pj)**2
      > (px - pi - 0.5 * CASE WHEN px < pi THEN -1 ELSE 1 END)**2
      + (py - pj - CASE WHEN py < pj THEN -1 ELSE 1 END)**2
    THEN [
      (pi + 0.5 * (CASE WHEN px < pi THEN -1 ELSE 1 END + CASE WHEN pj & 1 > 0 THEN 1 ELSE -1 END))::INTEGER,
      (pj + CASE WHEN py < pj THEN -1 ELSE 1 END)::INTEGER
    ]
    ELSE [pi::INTEGER, pj::INTEGER]
  END`
  };

  for (const c of Object.values(q.select)) {
    const { aggregate, field } = c;
    if (aggregate && field) {
      subsel[field] = field;
    }
  }

  select.x = `((${key}[1] + 0.5 * (${key}[2] & 1)) * ${dx} + ${ox})::DOUBLE`;
  select.y = `(${key}[2] * ${dy} + ${oy})::DOUBLE`;
  sql.from({
    hex: from(q.from).select(subsel).where(
      isNotNull(x),
      isNotNull(y),
      ...sql._where
    )
  });

  sql._where = [];
}

export function _hexbin(select, key, x, y, {
  binWidth = 20, domainX, domainY, width, height
} = {}) {
  const dx = binWidth;
  const dy = dx * (1.5 / Math.sqrt(3));
  const [x1, x2] = domainX;
  const [y1, y2] = domainY;
  const xspan = x2 - x1;
  const yspan = y2 - y1;
  const xx = `(${width} * (${x} - ${x1}) / ${xspan})`;
  const yy = `(${height} * (${y} - ${y1}) / ${yspan})`;

  return Object.assign(select, {
    py: `${yy} / ${dy}`,
    pj: `ROUND(py)::INTEGER`,
    px: `(${xx} - 0.5) / ${dx} - 0.5 * (pj & 1)`,
    pi: `ROUND(px)::INTEGER`,
    [key]: `CASE
    WHEN ABS(py-pj) * 3 > 1 AND (px-pi)**2 + (py-pj)**2
      > (px - pi - 0.5 * CASE WHEN px < pi THEN -1 ELSE 1 END)**2
      + (py - pj - CASE WHEN py < pj THEN -1 ELSE 1 END)**2
    THEN [
      pi + 0.5 * (CASE WHEN px < pi THEN -1 ELSE 1 END + CASE WHEN pj & 1 > 0 THEN 1 ELSE -1 END),
      pj + CASE WHEN py < pj THEN -1 ELSE 1 END
    ]
    ELSE [pi, pj]
  END`
  });
}
