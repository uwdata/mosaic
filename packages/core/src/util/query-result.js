export function queryResult() {
  let resolve;
  let reject;
  const p = new Promise((r, e) => { resolve = r; reject = e; });
  return Object.assign(p, {
    fulfill: value => (resolve(value), p),
    reject: err => (reject(err), p)
  });
}
