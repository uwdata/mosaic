import { MosaicClient } from '../mosaic/index.js';
import {
  Query, column, regexp_matches, contains, prefix, suffix, literal
} from '../sql/index.js';

const FUNCTIONS = { contains, prefix, suffix, regexp: regexp_matches };
let _id = 0;

export class Search extends MosaicClient {
  constructor({
    filterBy,
    table,
    column,
    label,
    type,
    as
  } = {}) {
    super(filterBy);
    this.id = 'search_' + (++_id);
    this.type = type;
    this.table = table;
    this.column = column;
    this.selection = as;

    this.element = document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    if (label) {
      const lab = document.createElement('label');
      lab.setAttribute('for', this.id);
      lab.innerText = label;
      this.element.appendChild(lab);
    }

    this.searchbox = document.createElement('input');
    this.searchbox.setAttribute('id', this.id);
    this.searchbox.setAttribute('type', 'text');
    this.searchbox.setAttribute('placeholder', 'Query');
    this.element.appendChild(this.searchbox);

    if (this.selection) {
      this.searchbox.addEventListener('input', () => {
        const value = this.searchbox.value || null;
        const { column, type } = this;
        this.selection.update({
          client: this,
          value,
          predicate: value ? FUNCTIONS[type](column, literal(value)) : null
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
      .select({ list: column })
      .distinct()
      .where(filter);
  }

  queryResult(data) {
    const list = document.createElement('datalist');
    const id = `${this.id}_list`;
    list.setAttribute('id', id);
    for (const d of data) {
      const opt = document.createElement('option');
      opt.setAttribute('value', d.list);
      list.append(opt);
    }
    if (this.datalist) this.datalist.remove();
    this.element.appendChild(this.datalist = list);
    this.searchbox.setAttribute('list', id);
    return this;
  }
}
