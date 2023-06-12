export function queryResult() {
  let resolve;
  let reject;
  const p = new Promise((r, e) => { resolve = r; reject = e; });
  p.fulfill = value => (resolve(value), p);
  p.reject = err => (reject(err), p);
  return p;
}
