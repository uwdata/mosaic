import { isSelection, isSignal, MosaicClient } from '@mosaic/core';
import { Query, column as columnRef, eq, literal } from '@mosaic/sql';

const isObject = v => {
  return v && typeof v === 'object' && !Array.isArray(v);
};

export class Menu extends MosaicClient {
  constructor({
    filterBy,
    from,
    column,
    label = column,
    options,
    value,
    as
  } = {}) {
    super(filterBy);
    this.from = from;
    this.column = column;
    this.selection = as;

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
        this.publish(this.select.value || null);
      });
      if (!isSelection(this.selection)) {
        this.selection.addEventListener('value', value => {
          if (value !== this.select.value) {
            this.select.value = value;
          }
        });
      }
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
    const { data, select } = this;
    select.replaceChildren();
    for (const { value, label = value } of data) {
      const opt = document.createElement('option');
      opt.setAttribute('value', value);
      opt.innerText = label; // TODO: label formatting?
      this.select.appendChild(opt);
    }
    if (this.selection) {
      this.select.value = this.selection?.value || '';
    }
    return this;
  }
}
