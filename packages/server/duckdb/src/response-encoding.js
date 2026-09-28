export function responseEncoding(header) {
  const qualities = new Map();
  for (const entry of (header || '').split(',')) {
    const [name, ...parameters] = entry.trim().toLowerCase().split(';');
    if (!name) continue;
    let quality = 1;
    for (const parameter of parameters) {
      const [key, value] = parameter.trim().split('=');
      if (key === 'q') {
        quality = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(value ?? '') ? Number(value) : 0;
      }
    }
    qualities.set(name, Math.max(qualities.get(name) ?? 0, quality));
  }
  const gzip = qualities.get('gzip') ?? qualities.get('*') ?? 0;
  const identity = qualities.get('identity') ?? (qualities.get('*') === 0 ? 0 : 1);
  return { gzip: gzip > 0 && gzip >= identity, identity: identity > 0 };
}
