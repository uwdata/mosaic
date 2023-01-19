import binTransform from '../transforms/bin.js';

export function from(table, options) {
  return { table, options };
}

export function bin(field, options = { steps: 25 }) {
  return (channel, type) => {
    return hasExtent(channel, type)
      ? {
          [`${channel}1`]: binTransform(field, options),
          [`${channel}2`]: binTransform(field, { ...options, offset: 1 })
        }
      : {
          [channel]: binTransform(field, options)
        };
  };
}

const EXTENT = [
  'rectY-x', 'rectX-y', 'rect-x', 'rect-y'
];

function hasExtent(channel, type) {
  return EXTENT.includes(`${type}-${channel}`);
}
