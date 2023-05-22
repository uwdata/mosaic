export function create(name, query, options = {}) {
  const { temp, replace, type = 'TABLE' } = options;
  const create = `CREATE${replace ? ' OR REPLACE' : ''}`;
  const spec = `${temp ? 'TEMP ' : ''}${type}${replace ? '' : ' IF NOT EXISTS'}`;
  return `${create} ${spec} ${name} AS ${query}`;
}
