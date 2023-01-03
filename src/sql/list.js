export function unnest(arg) {
  return {
    op: 'UNNEST',
    arg,
    toString() {
      return `UNNEST(${Array.isArray(arg) ? `[${arg.join(', ')}]` : arg})`;
    }
  }
}
