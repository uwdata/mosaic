export function createTable(db, name, as, options = {}) {
  const { temp, replace } = options;
  const create = `CREATE${replace ? ' OR REPLACE' : ''}`;
  const type = `${temp ? 'TEMP ' : ''}TABLE${replace ? '' : ' IF NOT EXISTS'}`;
  return db.exec(`${create} ${type} ${name} AS ${as}`);
}
