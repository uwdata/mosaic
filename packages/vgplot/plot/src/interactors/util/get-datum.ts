/**
 * Return the bound datum value on a Plot-generated SVG element.
 * Following D3, bound data is assigned to the `__data__` property.
 * However, the target mark may be wrapped within a hyperlink `a` tag.
 * @param el A DOM element.
 * @returns The bound datum.
 */
export function getDatum(el: Element & { __data__: any }): any {
  if (el.tagName === 'a') {
    //@ts-expect-error `__data__` missing on children
    el = el.children[0];
  }
  const data = el.__data__;
  return Array.isArray(data) ? data[0] : data;
}
