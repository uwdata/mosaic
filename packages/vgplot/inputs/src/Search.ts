import type * as mc from '@uwdata/mosaic-core'
import type * as msql from '@uwdata/mosaic-sql'
import { isParam, isSelection, clauseMatch } from '@uwdata/mosaic-core';
import { Query } from '@uwdata/mosaic-sql';
import { Input, input } from './input.js';

let _id = 0;

/** Search options object.
 * @property element The parent DOM element in which to place the search elements. If undefined, a new `div` element is created.
 * @property filterBy A selection to filter the database table indicated by the *from* option.
 * @property as The output param or selection. A selection clause is added based on the current text search query.
 * @property field The database column name to use within generated selection clause predicates. Defaults to the *column* option.
 * @property type The type of text search query to perform. One of:
 *  - `"contains"` (default): the query string may appear anywhere in the text
 *  - `"prefix"`: the query string must appear at the start of the text
 *  - `"suffix"`: the query string must appear at the end of the text
 *  - `"regexp"`: the query string is a regular expression the text must match
 * @property from The name of a database table to use as a data source for this widget. Used in conjunction with the *column* option.
 * @property column The name of a database column from which to pull valid search results. The unique column values are used as search autocomplete values. Used in conjunction with the *from* option.
 * @property label A text label for this input.
 */
interface SearchOptions {
  element?: HTMLElement;
  filterBy?: mc.Selection;
  as?: mc.Param<unknown>;
  field?: string;
  type?: 'contains' | 'prefix' | 'suffix' | 'regexp';
  from?: string;
  column?: string;
  label?: string;
}

/**
 * Create a new text search input instance.
 * @param options A {@link SearchOptions} object.
 * @returns The container element for a text search input.
 */
export function search(options: SearchOptions): HTMLElement {
  return input(Search, options);
}

/** A HTML text search input.*/
export class Search extends Input {
  id: string
  type: 'contains' | 'prefix' | 'suffix' | 'regexp'
  from?: string;
  column?: string;
  field?: string;
  selection?: mc.Param<unknown>;
  searchbox: HTMLInputElement;
  data: { list: string }[];
  datalist?: HTMLDataListElement;
  /**
   * Create a new text search input.
   * @param options A {@link SearchOptions} object.
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
  }: SearchOptions = {}) {
    super(filterBy, element);
    this.id = 'search_' + (++_id);
    this.type = type;
    this.from = from;
    this.column = column;
    this.selection = as;
    this.field = field;

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
        this.selection.addEventListener('value', (value: string) => {
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

  reset(): void {
    this.searchbox.value = '';
  }

  clause(value: string | null | undefined): mc.SelectionClause {
    const { field, type } = this;
    return clauseMatch(field, value, { source: this, method: type });
  }

  activate(): void {
    if (isSelection(this.selection)) {
      this.selection.activate(this.clause(''));
    }
  }

  publish(value: string | null | undefined): void {
    const { selection } = this;
    if (isSelection(selection)) {
      selection.update(this.clause(value));
    } else if (isParam(selection)) {
      selection.update(value);
    }
  }

  query(filter: msql.FilterExpr = []): msql.SelectQuery {
    const { from, column } = this;
    if (!from) return null;
    return Query
      .from(from)
      .select({ list: column })
      .distinct()
      .where(filter);
  }

  queryResult(data: { list: string }[]): this {
    this.data = data;
    return this;
  }

  update(): this {
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
