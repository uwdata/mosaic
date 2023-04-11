export function synchronizer() {
  const set = new Set;
  let done;
  let promise = new Promise(resolve => done = resolve);

  return {
    pending(item) {
      set.add(item);
    },
    ready(item) {
      set.delete(item);
      return set.size === 0;
    },
    resolve() {
      promise = new Promise(resolve => {
        done();
        done = resolve;
      });
    },
    get promise() {
      return promise;
    }
  }
}
