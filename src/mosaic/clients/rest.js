export function rest(uri = 'http://localhost:3000/') {
  return query => fetch(uri, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });
}
