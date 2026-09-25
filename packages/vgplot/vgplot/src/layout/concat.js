export function concat({ direction = 'vertical', wrap = false }, children) {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = direction === 'vertical' ? 'column' : 'row';
  div.style.flexWrap = !wrap ? 'nowrap' : wrap === true ? 'wrap' : wrap;
  div.style.justifyContent = 'flex-start';
  div.style.alignItems = 'flex-start';
  children.forEach(child => div.appendChild(child));
  Object.assign(div, { value: { element: div } });
  return div;
}

export function vconcat(...plots) {
  return concat({ direction: 'vertical' }, plots.flat());
}

export function hconcat(...plots) {
  return concat({ direction: 'horizontal' }, plots.flat());
}

/**
 * Layer elements on top of one another, in order: later elements are drawn
 * over earlier ones. All elements share a single grid cell, so the container
 * is as large as its largest child.
 *
 * Children smaller than the container are positioned within it by the
 * *halign* and *valign* options, each a number in [0, 1] like the *align*
 * option of ordinal scales: 0 (default) aligns to the start (left, top), 0.5
 * centers, and 1 aligns to the end (right, bottom). Pass the options as a
 * leading object: `zconcat({ halign: 0.5, valign: 0.5 }, plot1, plot2)`.
 */
export function zconcat(...args) {
  const [{ halign = 0, valign = 0 }, plots] = isOptions(args[0])
    ? [args[0], args.slice(1)]
    : [{}, args];
  const div = document.createElement('div');
  div.style.display = 'grid';
  // shrink-wrap the largest child, rather than filling the available width
  div.style.width = 'fit-content';
  div.style.justifyItems = 'start';
  div.style.alignItems = 'start';
  plots.flat().forEach(child => {
    child.style.gridArea = '1 / 1';
    if (halign || valign) {
      // Percentages of a grid item's offsets refer to its grid area (the
      // shared cell), and those of a transform to the item itself, so this
      // places the item's edge at align * (cell size - item size).
      child.style.position = 'relative';
      child.style.left = percent(halign);
      child.style.top = percent(valign);
      child.style.transform = `translate(${percent(-halign)}, ${percent(-valign)})`;
    }
    div.appendChild(child);
  });
  Object.assign(div, { value: { element: div } });
  return div;
}

// A leading plain object (rather than a DOM node or an array of nodes)
function isOptions(arg) {
  return arg != null && typeof arg === 'object'
    && !Array.isArray(arg) && !('nodeType' in arg);
}

function percent(fraction) {
  return `${Number((fraction * 100).toPrecision(12))}%`;
}
