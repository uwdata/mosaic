/**
 * Patch the getScreenCTM method to memoize the last non-null
 * result seen. This will let the method continue to function
 * even after the node is removed from the DOM.
 */
export function patchScreenCTM() {
  const node = this;
  const getScreenCTM = node.getScreenCTM;
  let memo;
  node.getScreenCTM = () => {
    return node.isConnected ? (memo = getScreenCTM.call(node)) : memo;
  };
}
