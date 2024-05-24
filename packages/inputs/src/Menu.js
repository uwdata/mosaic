import { MosaicClient, isParam, isSelection } from '@uwdata/mosaic-core';
import { Query, eq, literal } from '@uwdata/mosaic-sql';
import { input } from './input.js';

const isObject = v => {
  return v && typeof v === 'object' && !Array.isArray(v);
};

export const menu = options => input(Menu, options);

export class Menu extends MosaicClient {
  /**
   * Create a new Menu instance.
   * @param {object} options Options object
   */
  constructor({
    element,
    filterBy,
    from,
    column,
    label = column,
    format = x => x, // TODO
    options,
    value,
    as
  } = {}) {
    super(filterBy);
    this.from = from;
    this.column = column;
    this.format = format;
    const selection = this.selection = as;

    this.element = element ?? document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    const lab = document.createElement('label');
    lab.innerText = label || column;
    this.element.appendChild(lab);

    this.select = document.createElement('select');
    this.element.appendChild(this.select);

    // if provided, populate menu options
    if (options) {
      this.data = options.map(value => isObject(value) ? value : { value });
      this.selectedValue(value ?? '');
      this.update();
    }

    // initialize selection or param bindings
    if (selection) {
      const isParam = !isSelection(selection);

      // publish any initial menu value to the selection/param
      // later updates propagate this back to the menu element
      // do not publish if using a param that already has a value
      if (value != null && (!isParam || selection.value === undefined)) {
        this.publish(value);
      }

      // publish selected value upon menu change
      this.select.addEventListener('input', () => {
        this.publish(this.selectedValue() ?? null);
      });

      // if bound to a scalar param, respond to value updates
      if (isParam) {
        this.selection.addEventListener('value', value => {
          if (value !== this.select.value) {
            this.selectedValue(value);
          }
        });
      }
    }
  }

  selectedValue(value) {
    if (arguments.length === 0) {
      const index = this.select.selectedIndex;
      return this.data[index].value;
    } else {
      const index = this.data?.findIndex(opt => opt.value === value);
      if (index >= 0) {
        this.select.selectedIndex = index;
      } else {
        this.select.value = String(value);
      }
    }
  }

  reset() {
    this.select.selectedIndex = this.from ? 0 : -1;
  }

  publish(value) {
    const { selection, column } = this;
    if (isSelection(selection)) {
      selection.update({
        source: this,
        schema: { type: 'point' },
        value,
        predicate: (value !== '' && value !== undefined) ? eq(column, literal(value)) : null
      });
    } else if (isParam(selection)) {
      selection.update(value);
    }
  }

  query(filter = []) {
    const { from, column } = this;
    if (!from) return null;
    return Query
      .from(from)
      .select({ value: column })
      .distinct()
      .where(filter)
      .orderby(column)
  }

  queryResult(data) {
    // column option values, with an inserted 'All' value
    this.data = [{ value: '', label: 'All' }, ...data];
    return this;
  }

  update() {
    const { data, format, select, selection } = this;

    // generate menu item options
    select.replaceChildren();
    for (const { value, label } of data) {
      const opt = document.createElement('option');
      opt.setAttribute('value', value);
      opt.innerText = label ?? format(value);
      this.select.appendChild(opt);
    }

    // update menu value based on param/selection
    if (selection) {
      const value = isSelection(selection)
        ? selection.valueFor(this)
        : selection.value;
      this.selectedValue(value ?? '');
    }

    return this;
  }
}
