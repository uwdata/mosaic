import { isSelection, isSignal, MosaicClient } from '@uwdata/mosaic-core';
import { Query, column as columnRef, eq, literal } from '@uwdata/mosaic-sql';

const isObject = v => {
  return v && typeof v === 'object' && !Array.isArray(v);
};

export class Menu extends MosaicClient {
  constructor({
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
    this.selection = as;
    this.format = format;

    this.element = document.createElement('div');
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
    value = value ?? this.selection?.value ?? this.data?.[0]?.value;
    this.select.value = value;
    if (this.selection?.value === undefined) this.publish(value);
    this.element.appendChild(this.select);

    if (this.selection) {
      this.select.addEventListener('input', () => {
        this.publish(this.selectedValue() || null);
      });
      if (!isSelection(this.selection)) {
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
      // TODO make more robust
      this.select.value = String(value);
    }
  }

  publish(value) {
    const { selection, column } = this;
    if (isSelection(selection)) {
      selection.update({
        source: this,
        schema: { type: 'point' },
        value,
        predicate: value ? eq(column, literal(value)) : null
      });
    } else if (isSignal(selection)) {
      selection.update(value);
    }
  }

  fields() {
    const { from, column } = this;
    return from ? [ columnRef(from, column) ] : null;
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
    if (this.selection) {
      this.select.value = this.selection?.value || '';
    }
    return this;
  }
}
