import { transform } from './ref.js';

export const epoch_ms = transform(
  d => `(1000 * (epoch(${d}) - second(${d})) + millisecond(${d}))::DOUBLE`
);
