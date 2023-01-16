import { MosaicClient } from '../mosaic/index.js';
import { Query, column, eq, literal } from '../sql/index.js';

export class Menu extends MosaicClient {
  constructor({
    filterBy,
    table,
    column,
    label = field,
    as
  } = {}) {
    super(filterBy);
    this.table = table;
    this.column = column;
    this.selection = as;

    this.element = document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    const lab = document.createElement('label');
    lab.innerText = label || column;
    this.element.appendChild(lab);

    this.select = document.createElement('select');
    this.element.appendChild(this.select);

    const opt = document.createElement('option');
    opt.setAttribute('value', '');
    opt.innerText = 'All';
    this.select.appendChild(opt);

    if (this.selection) {
      this.select.addEventListener('input', () => {
        const value = this.select.value || null;
        this.selection.update({
          client: this,
          value,
          predicate: value ? eq(column, literal(value)) : null
        });
      });
    }
  }

  fields() {
    return [ column(this.table, this.column) ];
  }

  query(filter = []) {
    const { table, column } = this;
    return Query
      .from(table)
      .select({ value: column })
      .distinct()
      .where(filter)
      .orderby(column)
  }

  queryResult(data) {
    for (const { value } of data) {
      const opt = document.createElement('option');
      opt.setAttribute('value', value);
      opt.innerText = value; // TODO: format labels
      this.select.appendChild(opt);
    }
    return this;
  }
}
