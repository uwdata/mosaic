export function parameters(options) {
  return Object.entries(options)
    .map(([key, value]) => {
      const t = typeof value;
      const v = t === 'boolean' ? String(value)
        : t === 'string' ? `'${value}'`
        : value;
      return `${key}=${v}`;
    })
    .join(', ');
}
