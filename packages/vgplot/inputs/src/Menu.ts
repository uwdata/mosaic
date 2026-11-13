import type * as mc from '@uwdata/mosaic-core'
import type * as msql from '@uwdata/mosaic-sql'
import { isParam, isSelection, clausePoint, clauseList } from '@uwdata/mosaic-core';
import { Query, unnest } from '@uwdata/mosaic-sql';
import { Input, input } from './input.js';

type Option = { value: any; label?: string }

/** Menu options object.
 * @property element The parent DOM element in which to place the menu elements. If undefined, a new `div` element is created.
 * @property filterBy A selection to filter the database table indicated by the *from* option.
 * @property as The output param or selection. A selection clause is added for the currently selected menu option.
 * @property field The database column name to use within generated selection clause predicates. Defaults to the *column* option.
 * @property options An array of menu options, as literal values or option objects. Option objects have a `value` property and an optional `label` property. If no label or *format* function is provided, the string-coerced value is used.
 * @property format A format function that takes an option value as input and generates a string label. The format function is not applied when an explicit label is provided in an option object.
 * @property value The initial selected menu value.
 * @property from The name of a database table to use as a data source for this widget. Used in conjunction with the *column* option.
 * @property column The name of a database column from which to pull menu options. The unique column values are used as menu options. Used in conjunction with the *from* option.
 * @property label A text label for this input.
 * @property listMatch The list match mode.
 */
interface MenuOptions {
  element?: HTMLElement;
  filterBy?: mc.Selection;
  as?: mc.Param<unknown> | mc.Selection;
  field?: string;
  options?: (any | Option)[];
  format?: (value: any) => string;
  value?: any;
  from?: string;
  column?: string;
  label?: string;
  listMatch?: 'any' | 'all';
}

function isObject(v: unknown): v is Option {
  return v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Create a new menu input instance.
 * @param options A {@link MenuOptions} object.
 * @returns The container element for a menu component.
 */
export function menu(options: MenuOptions): HTMLElement {
  return input(Menu, options);
}

/** A HTML `<select>`-based dropdown menu input.*/
export class Menu extends Input {
  from?: string;
  column?: string;
  format: (value: any) => string;
  field?: string;
  listMatch?: 'any' | 'all';
  selection?: mc.Param<unknown> | mc.Selection;
  select: HTMLSelectElement;
  data: Option[];
  /**
   * Create a new Menu instance. 
   * @param options A {@link MenuOptions} object.
   */
  constructor({
    element,
    filterBy,
    as,
    from,
    column,
    label = column,
    format = x => x, // TODO
    options,
    value,
    field = column,
    listMatch,
  }: MenuOptions = {}) {
    super(filterBy, element);
    this.from = from;
    this.column = column;
    this.format = format;
    this.field = field;
    this.listMatch = listMatch;
    const selection = this.selection = as;

    const lab = document.createElement('label');
    lab.innerText = label || column;
    this.element.appendChild(lab);

    this.select = document.createElement('select');
    this.element.appendChild(this.select);

    // if provided, populate menu options
    if (options) {
      this.data = options.map(opt => isObject(opt) ? opt : { value: opt });
      this.selectedValue(value === undefined ? '' : value);
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
      } else {
        // trigger selection activation
        this.select.addEventListener('pointerenter', evt => {
          if (!evt.buttons) this.activate();
        });
        this.select.addEventListener('focus', () => this.activate());
      }
    }
  }

  selectedValue(value?: unknown): unknown | undefined {
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

  reset(): void {
    this.select.selectedIndex = this.from ? 0 : -1;
  }

  activate(): void {
    if (isSelection(this.selection)) {
      this.selection.activate(clausePoint(this.field, 0, { source: this }));
    }
  }

  publish(value: unknown): void {
    const { selection, field, listMatch } = this;
    if (isSelection(selection)) {
      if (value === '') value = undefined; // 'All' option
      const clause = listMatch
        ? clauseList(field, value, { source: this, listMatch })
        : clausePoint(field, value, { source: this });
      selection.update(clause);
    } else if (isParam(selection)) {
      selection.update(value);
    }
  }

  query(filter: msql.FilterExpr = []): msql.SelectQuery {
    const { from, column, listMatch } = this;
    if (!from) return null;
    return Query
      .from(from)
      .select({ value: listMatch ? unnest(column) : column })
      .distinct()
      .where(filter)
      .orderby(column)
  }

  queryResult(data: Option[]): this {
    // column option values, with an inserted 'All' value
    this.data = [{ value: '', label: 'All' }, ...data];
    return this;
  }

  update(): this {
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
      this.selectedValue(value === undefined ? '' : value);
    }

    return this;
  }
}
