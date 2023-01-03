import binTransform from '../transforms/bin.js';

export function from(table, options) {
  return { table, options };
}

// export function bin(field, options = { steps: 25 }) {
//   return channel => ({
//     [`${channel}1`]: { transform: 'bin', field, options },
//     [`${channel}2`]: { transform: 'bin', field, options: { ...options, offset: 1 } }
//   });
// }

export function bin(field, options = { steps: 25 }) {
  return channel => ({
    [`${channel}1`]: binTransform(field, options),
    [`${channel}2`]: binTransform(field, { ...options, offset: 1 })
  });
}

// export function count() {
//   return { aggregate: 'count' };
// }

// export function sum(field) {
//   return { aggregate: 'sum', field };
// }

// export function avg(field) {
//   return { aggregate: 'avg', field };
// }

// export function min(field) {
//   return { aggregate: 'min', field };
// }

// export function max(field) {
//   return { aggregate: 'max', field };
// }
