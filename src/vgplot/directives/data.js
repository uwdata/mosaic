export function from(table, options) {
  return { table, options };
}

export function bin(field, options = { steps: 20 }) {
  return { transform: 'bin', field, options };
}

export function binX(field, options = { steps: 20 }) {
  return {
    x1: { transform: 'bin', field, options },
    x2: { transform: 'bin', field, options: { ...options, offset: 1 } }
  };
}

export function binY(field, options = { steps: 20 }) {
  return {
    y1: { transform: 'bin', field, options },
    y2: { transform: 'bin', field, options: { ...options, offset: 1 } }
  };
}

export function count() {
  return { aggregate: 'count' };
}

export function min(field) {
  return { aggregate: 'min', field };
}

export function max(field) {
  return { aggregate: 'max', field };
}
