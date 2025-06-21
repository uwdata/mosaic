/** @import { Selection } from '@uwdata/mosaic-core' */
import { clausePoints, coordinator, isParam, isSelection, queryFieldInfo, toDataColumns } from '@uwdata/mosaic-core';
import { Query, desc } from '@uwdata/mosaic-sql';
import { formatDate, formatLocaleAuto, formatLocaleNumber } from './util/format.js';
import { Input, input } from './input.js';

let _id = -1;

/**
 * Create a new table input instance.
 * @param {object} options Options object
 * @param {HTMLElement} [options.element] The parent DOM element in which to
 *  place the table element. If undefined, a new `div` element is created.
 * @param {Selection} [options.filterBy] A selection to filter the database
 *  table indicated by the *from* option.
 * @param {Selection} [options.as] The output selection. A selection
 *  clause is added for the currently selected table row.
 * @param {{ [name: string]: 'left' | 'right' | 'center' }} [options.align]
 *  An object that maps column names to horiztonal text alignment values. If
 *  unspecified, alignment is determined based on the column data type.
 * @param {{ [name: string]: (value: any) => string }} [options.format] An
 *  object that maps column names to format functions to use for that
 *  column's data. Each format function takes a value as input and generates
 *  formatted text to show in the table.
 * @param {string} [options.from] The name of a database table to use as a data
 *  source for this widget. Used in conjunction with the *columns* option.
 * @param {string[]} [options.columns] The name of database columns to include
 *  in the table component. If unspecified, all columns are included.
 *  Used in conjunction with the *from* option.
 * @param {number | { [name: string]: number }} [options.width] If a number,
 *  sets the desired width of the table, in pixels. If an object, is used to
 *  set explicit pixel widts for each named column included in the object.
 * @param {number} [options.maxWidth] The maximum width of the table, in pixels.
 * @param {number} [options.height] The desired height of the table, in pixels.
 * @param {number} [options.rowBatch] The number of rows to request per query
 *  batch. The batch size will be used to prefetch data beyond the currently
 *  visible range.
 * @returns {HTMLElement} The container element for a table component.
 */
export const table = options => input(Table, options);

/**
 * A HTML table based table component.
 * @extends {Input}
 */
export class Table extends Input {
  /**
   * Create a new Table instance.
   * @param {object} options Options object
   * @param {HTMLElement} [options.element] The parent DOM element in which to
   *  place the table element. If undefined, a new `div` element is created.
   * @param {Selection} [options.filterBy] A selection to filter the database
   *  table indicated by the *from* option.
   * @param {Selection} [options.as] The output selection. A selection
   *  clause is added for the currently selected table row.
   * @param {{ [name: string]: 'left' | 'right' | 'center' }} [options.align]
   *  An object that maps column names to horiztonal text alignment values. If
   *  unspecified, alignment is determined based on the column data type.
   * @param {{ [name: string]: (value: any) => string }} [options.format] An
   *  object that maps column names to format functions to use for that
   *  column's data. Each format function takes a value as input and generates
   *  formatted text to show in the table.
   * @param {string} [options.from] The name of a database table to use as a data
   *  source for this widget. Used in conjunction with the *columns* option.
   * @param {string[]} [options.columns] The name of database columns to include
   *  in the table component. If unspecified, all columns are included.
   *  Used in conjunction with the *from* option.
   * @param {number | { [name: string]: number }} [options.width] If a number,
   *  sets the desired width of the table, in pixels. If an object, is used to
   *  set explicit pixel widts for each named column included in the object.
   * @param {number} [options.maxWidth] The maximum width of the table, in pixels.
   * @param {number} [options.height] The desired height of the table, in pixels.
   * @param {number} [options.rowBatch] The number of rows to request per query
   *  batch. The batch size will be used to prefetch data beyond the currently
   *  visible range.
   */
  constructor({
    element,
    filterBy,
    from,
    columns = ['*'],
    align = {},
    format,
    width,
    maxWidth,
    height = 500,
    rowBatch = 100,
    as
  } = {}) {
    super(filterBy, element, null);

    this.id = `table-${++_id}`;
    this.element.setAttribute('id', this.id);

    this.from = from;
    this.columns = columns;
    this.format = format;
    this.align = align;
    this.widths = typeof width === 'object' ? width : {};

    if (isParam(from)) {
      // if data table is a param, re-initialize upon change
      from.addEventListener('value', () => this.initialize());
    }

    this.offset = 0;
    this.limit = +rowBatch;
    this.isPending = false;

    this.selection = as;
    this.currentRow = -1;

    this.sortHeader = null;
    this.sortColumn = null;
    this.sortDesc = false;

    if (typeof width === 'number') this.element.style.width = `${width}px`;
    if (maxWidth) this.element.style.maxWidth = `${maxWidth}px`;
    this.element.style.maxHeight = `${height}px`;
    this.element.style.overflow = 'auto';

    let prevScrollTop = -1;
    this.element.addEventListener('scroll', evt => {
      const { isPending, loaded } = this;
      // @ts-ignore
      const { scrollHeight, scrollTop, clientHeight } = evt.target;

      const back = scrollTop < prevScrollTop;
      prevScrollTop = scrollTop;
      if (back || isPending || loaded) return;

      if (scrollHeight - scrollTop < 2 * clientHeight) {
        this.isPending = true;
        this.requestData(this.offset + this.limit);
      }
    });

    this.tbl = document.createElement('table');
    this.element.appendChild(this.tbl);

    this.head = document.createElement('thead');
    this.tbl.appendChild(this.head);

    this.body = document.createElement('tbody');
    this.tbl.appendChild(this.body);

    if (this.selection) {
      this.body.addEventListener('pointerover', evt => {
        const row = resolveRow(evt.target);
        if (row > -1 && row !== this.currentRow) {
          this.currentRow = row;
          this.selection.update(this.clause([row]));
        }
      });
      this.body.addEventListener('pointerleave', () => {
        this.currentRow = -1;
        this.selection.update(this.clause());
      });
    }

    this.style = document.createElement('style');
    this.element.appendChild(this.style);
  }

  sourceTable() {
    return isParam(this.from) ? this.from.value : this.from;
  }

  clause(rows = []) {
    const { data, limit, schema } = this;
    const fields = schema.map(s => s.column);
    const values = rows.map(row => {
      const { columns } = data[~~(row / limit)];
      return fields.map(f => columns[f][row % limit]);
    });
    return clausePoints(fields, values, { source: this });
  }

  requestData(offset = 0) {
    this.offset = offset;

    // request next data batch
    const query = this.query(this.filterBy?.predicate(this));
    this.requestQuery(query);

    // prefetch subsequent data batch
    coordinator().prefetch(query.clone().offset(offset + this.limit));
  }

  async prepare() {
    // query for column scheam information
    const table = this.sourceTable();
    const fields = this.columns.map(column => ({ column, table }));
    const schema = await queryFieldInfo(this.coordinator, fields);
    this.schema = schema;

    // create table header row
    const thead = this.head;
    thead.innerHTML = '';
    const tr = document.createElement('tr');
    for (const { column } of schema) {
      const th = document.createElement('th');
      th.addEventListener('click', evt => this.sort(evt, column));
      th.appendChild(document.createElement('span'));
      th.appendChild(document.createTextNode(column));
      tr.appendChild(th);
    }
    thead.appendChild(tr);

    // get column formatters
    this.formats = formatof(this.format, schema);

    // get column alignment style
    this.style.innerText = tableCSS(
      this.id,
      alignof(this.align, schema),
      widthof(this.widths, schema)
    );
  }

  query(filter = []) {
    const { limit, offset, schema, sortColumn, sortDesc } = this;
    return Query.from(this.sourceTable())
      .select(schema.map(s => s.column))
      .where(filter)
      .orderby(sortColumn ? (sortDesc ? desc(sortColumn) : sortColumn) : [])
      .limit(limit)
      .offset(offset);
  }

  queryResult(data) {
    if (!this.isPending) {
      // data is not from an internal request, so reset table
      this.loaded = false;
      this.data = [];
      this.body.replaceChildren();
      this.offset = 0;
    }
    this.data.push(toDataColumns(data));
    return this;
  }

  update() {
    const { body, formats, data, schema, limit } = this;
    const nf = schema.length;
    const n = data.length - 1;
    const rowCount = limit * n;

    const { numRows, columns } = data[n];
    const cols = schema.map(s => columns[s.column]);
    for (let i = 0; i < numRows; ++i) {
      const tr = document.createElement('tr');
      Object.assign(tr, { __row__: rowCount + i });
      for (let j = 0; j < nf; ++j) {
        const value = cols[j][i];
        const td = document.createElement('td');
        td.innerText = value == null ? '' : formats[j](value);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }

    if (numRows < limit) {
      // data table has been fully loaded
      this.loaded = true;
    }

    this.isPending = false;
    return this;
  }

  activate() {
    if (isSelection(this.selection)) {
      this.selection.activate(this.clause([]));
    }
  }

  sort(event, column) {
    if (column === this.sortColumn) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortColumn = column;
      this.sortDesc = false;
    }

    const th = event.currentTarget;
    const currentHeader = this.sortHeader;
    if (currentHeader === th && event.metaKey) {
      currentHeader.firstChild.textContent = '';
      this.sortHeader = null;
      this.sortColumn = null;
    } else {
      if (currentHeader) currentHeader.firstChild.textContent = '';
      this.sortHeader = th;
      th.firstChild.textContent = this.sortDesc ? "▾"  : "▴";
    }

    // issue query for sorted data
    this.requestData();
  }
}

/**
 * Resolve a table row number from a table cell element.
 * @param {any} element An HTML element.
 * @returns {number} The resolved row, or -1 if not a row.
 */
function resolveRow(element) {
  const p = element.parentElement;
  return Object.hasOwn(p, '__row__') ? +p.__row__ : -1;
}

function formatof(base = {}, schema, locale) {
  return schema.map(({ column, type }) => {
    if (column in base) {
      return base[column];
    } else {
      switch (type) {
        case 'number': return formatLocaleNumber(locale);
        case 'date': return formatDate;
        default: return formatLocaleAuto(locale);
      }
    }
  });
}

function alignof(base = {}, schema) {
  return schema.map(({ column, type }) => {
    if (column in base) {
      return base[column];
    } else if (type === 'number') {
      return 'right';
    } else {
      return 'left';
    }
  });
}

function widthof(base = {}, schema) {
  return schema.map(({ column }) => base[column]);
}

function tableCSS(id, aligns, widths) {
  const styles = [];
  aligns.forEach((a, i) => {
    const w = +widths[i];
    if (a !== 'left' || w) {
      const align = a !== 'left' ? `text-align:${a};` : '';
      const width = w ? `width:${w}px;max-width:${w}px;` : '';
      styles.push(`#${id} tr>:nth-child(${i+1}) {${align}${width}}`);
    }
  });
  return styles.join(' ');
}
