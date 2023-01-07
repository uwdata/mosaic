import { expr } from './ref.js';

export function epoch_ms(d) {
  const cols = typeof d === 'string' ? [d] : (d.columns || []);
  return expr(
    `(1000 * (epoch(${d}) - second(${d})) + millisecond(${d}))::DOUBLE`,
    cols
  );
}
