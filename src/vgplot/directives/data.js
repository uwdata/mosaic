import binTransform from '../transforms/bin.js';

export function from(table, options) {
  return { table, options };
}

export function bin(field, options = { steps: 25 }) {
  return channel => ({
    [`${channel}1`]: binTransform(field, options),
    [`${channel}2`]: binTransform(field, { ...options, offset: 1 })
  });
}
