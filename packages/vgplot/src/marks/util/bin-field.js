import { epoch_ms, sql } from '@uwdata/mosaic-sql';

export function binField(mark, channel, expr) {
  if (!mark.stats) return field;
  const { field } = mark.channelField(channel);
  const { type } = mark.stats[field.column];
  expr = expr ?? field;
  return type === 'date' ? epoch_ms(expr) : expr;
}

export function bin1d(x, x0, x1, n, reverse = false, pad = 1) {
  const d = (n - pad) / (x1 - x0);
  const f = d !== 1 ? ` * ${d}::DOUBLE` : '';
  return reverse
    ? sql`(${+x1} - ${x}::DOUBLE)${f}`
    : sql`(${x}::DOUBLE - ${+x0})${f}`;
}
