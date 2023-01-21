export async function loadJSON(db, name, data, schema) {
  // TODO: get fields and types if schema not provided
  const cols = Object.keys(schema);

  // create table
  const defs = cols.map(name => `${name} ${schema[name]}`).join(', ');
  await db.exec(`CREATE TABLE ${name} (${defs})`);

  // generate insert query content
  const tuples = data.map(d => '(' + cols
    .map(name => {
      const v = d[name];
      return typeof v === 'string' ? `'${v}'` : v;
    })
    .join(', ') + ')'
  );

  // populate table
  return db.exec(`INSERT INTO ${name} VALUES ${tuples.join(', ')}`);
}
