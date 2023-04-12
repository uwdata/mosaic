/**
 * Create a new synchronizer instance to aid synchronization
 * of updates on multiple pending operations.
 */
export function synchronizer() {
  const set = new Set;
  let done;
  let promise = new Promise(resolve => done = resolve);

  return {
    /**
     * Mark an item as pending.
     * @param {*} item An item to synchronize on.
     */
    pending(item) {
      set.add(item);
    },
    /**
     * Mark a pending item as ready, indicating it is
     * ready for a synchronized update.
     * @param {*} item An item to synchronize on.
     * @returns {boolean} True if the synchronizer is ready to
     *  resolve, false otherwise.
     */
    ready(item) {
      set.delete(item);
      return set.size === 0;
    },
    /**
     * Resolve the current synchronization cycle, causing the synchronize
     * promise to resolve and thereby trigger downstream updates.
     */
    resolve() {
      promise = new Promise(resolve => {
        done();
        done = resolve;
      });
    },
    /**
     * The promise for the current synchronization cycle.
     * @return {Promise} The synchronization promise.
     */
    get promise() {
      return promise;
    }
  }
}
