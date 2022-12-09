export async function loadJSON(db, name, data, schema) {
  // TODO: get fields and types if schema not provided
  const cols = Object.keys(schema);

  // create table
  const defs = cols.map(name => `${name} ${schema[name]}`).join(', ');
  await db.exec(`CREATE TABLE ${name} (${defs});`);

  // generate insert query content
  const tuples = data.map(d => '(' + cols
    .map(name => {
      const v = d[name];
      return typeof v === 'string' ? `'${v}'` : v;
    })
    .join(', ') + ')'
  );

  // populate table
  return db.exec(`INSERT INTO ${name} VALUES ${tuples.join(', ')};`);

  // TOO SLOW FOR NOW...
  // // create prepared insert statement
  // const blanks = cols.map(() => '?').join(', ');
  // const stmt = db.prepare(`INSERT INTO ${name} VALUES (${blanks});`);

  // // populate table
  // for (const row of data) {
  //   stmt.run(cols.map(name => row[name]));
  // }

  // stmt.finalize();
}