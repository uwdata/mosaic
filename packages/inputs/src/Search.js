import { MosaicClient, Param, isParam, isSelection, clauseMatch } from '@uwdata/mosaic-core';
import { Query } from '@uwdata/mosaic-sql';
import { input } from './input.js';

let _id = 0;

export const search = options => input(Search, options);

export class Search extends MosaicClient {
  /**
   * Create a new text search input.
   * @param {object} [options] Options object
   * @param {HTMLElement} [options.element] The parent DOM element in which to
   *  place the search elements. If undefined, a new `div` element is created.
   * @param {Selection} [options.filterBy] A selection to filter the database
   *  table indicated by the *from* option.
   * @param {Param} [options.as] The output param or selection. A selection
   *  clause is added based on the current text search query.
   * @param {string} [options.field] The database column name to use within
   *  generated selection clause predicates. Defaults to the *column* option.
   * @param {'contains' | 'prefix' | 'suffix' | 'regexp'} [options.type] The
   *  type of text search query to perform. One of:
   *  - `"contains"` (default): the query string may appear anywhere in the text
   *  - `"prefix"`: the query string must appear at the start of the text
   *  - `"suffix"`: the query string must appear at the end of the text
   *  - `"regexp"`: the query string is a regular expression the text must match
   * @param {string} [options.from] The name of a database table to use as an
   *  autocomplete data source for this widget. Used in conjunction with the
   *  *column* option.
   * @param {string} [options.column] The name of a database column from which
   *  to pull valid search results. The unique column values are used as search
   *  autocomplete values. Used in conjunction with the *from* option.
   * @param {string} [options.label] A text label for this input.
   */
  constructor({
    element,
    filterBy,
    from,
    column,
    label,
    type = 'contains',
    field = column,
    as
  } = {}) {
    super(filterBy);
    this.id = 'search_' + (++_id);
    this.type = type;
    this.from = from;
    this.column = column;
    this.selection = as;
    this.field = field;

    this.element = element ?? document.createElement('div');
    this.element.setAttribute('class', 'input');
    Object.defineProperty(this.element, 'value', { value: this });

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
        this.publish(this.searchbox.value || null);
      });
      if (!isSelection(this.selection)) {
        this.selection.addEventListener('value', value => {
          if (value !== this.searchbox.value) {
            this.searchbox.value = value;
          }
        });
      } else {
        // trigger selection activation
        this.searchbox.addEventListener('pointerenter', evt => {
          if (!evt.buttons) this.activate();
        });
        this.searchbox.addEventListener('focus', () => this.activate());
      }
    }
  }

  reset() {
    this.searchbox.value = '';
  }

  clause(value) {
    const { field, type } = this;
    return clauseMatch(field, value, { source: this, method: type });
  }

  activate() {
    // @ts-ignore - activate is only called for a Selection
    this.selection.activate(this.clause(''));
  }

  publish(value) {
    const { selection } = this;
    if (isSelection(selection)) {
      selection.update(this.clause(value));
    } else if (isParam(selection)) {
      selection.update(value);
    }
  }

  query(filter = []) {
    const { from, column } = this;
    if (!from) return null;
    return Query
      .from(from)
      .select({ list: column })
      .distinct()
      .where(filter);
  }

  queryResult(data) {
    this.data = data;
    return this;
  }

  update() {
    const list = document.createElement('datalist');
    const id = `${this.id}_list`;
    list.setAttribute('id', id);
    for (const d of this.data) {
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
