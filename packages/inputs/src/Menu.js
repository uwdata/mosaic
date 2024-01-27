import { MosaicClient, isParam, isSelection } from '@uwdata/mosaic-core';
import { Query, eq, literal } from '@uwdata/mosaic-sql';
import { input } from './input.js';

const isObject = v => {
  return v && typeof v === 'object' && !Array.isArray(v);
};

export const menu = options => input(Menu, options);

export class Menu extends MosaicClient {
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
    this.selections = (as === undefined) ? [] : Array.isArray(as) ? as : [as];
    this.format = format;

    this.element = element ?? document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    const lab = document.createElement('label');
    lab.innerText = label || column;
    this.element.appendChild(lab);

    this.select = document.createElement('select');
    if (options) {
      this.data = options.map(value => isObject(value) ? value : { value });
      this.update();
    }
    this.selections.forEach(s => { value = value ?? s?.value});
    value = value ?? this.data?.[0]?.value;
    if (this.selections.some(s => s?.value === undefined)) {
      this.publish(value);
    }
    this.element.appendChild(this.select);

    this.selections.forEach(selection => {
      this.select.addEventListener('input', () => {
        this.publish(this.selectedValue() ?? null);
      });
      if (!isSelection(selection)) {
        selection.addEventListener('value', value => {
          if (value !== this.select.value) {
            this.selectedValue(value);
          }
        });
      }
    });
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
    const { selections, column } = this;
    selections.forEach(selection => {
      if (isSelection(selection)) {
        selection.update({
        source: this,
        schema: { type: 'point' },
        value,
        predicate: value ? eq(column, literal(value)) : null
      });
      } else if (isParam(selection)) {
      selection.update(value);
      }
    });
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
    this.data = [{ value: '', label: 'All' }, ...data];
    return this;
  }

  update() {
    const { data, format, select } = this;
    select.replaceChildren();
    for (const { value, label } of data) {
      const opt = document.createElement('option');
      opt.setAttribute('value', value);
      opt.innerText = label ?? format(value);
      this.select.appendChild(opt);
    }
    this.selections.forEach(selection => {
      this.selectedValue(selection?.value ?? '');
    });
    return this;
  }
}
