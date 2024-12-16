import { MosaicClient, clausePoints, coordinator, isParam, toDataColumns } from '@uwdata/mosaic-core';
import { Query, desc } from '@uwdata/mosaic-sql';
import { formatDate, formatLocaleAuto, formatLocaleNumber } from './util/format.js';
import { input } from './input.js';

let _id = -1;

export const table = options => input(Table, options);

export class Table extends MosaicClient {
  /**
   * Create a new Table instance.
   * @param {object} options Options object
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
    super(filterBy);
    this.id = `table-${++_id}`;
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

    this.element = element || document.createElement('div');
    this.element.setAttribute('id', this.id);
    Object.defineProperty(this.element, 'value', { value: this });
    if (typeof width === 'number') this.element.style.width = `${width}px`;
    if (maxWidth) this.element.style.maxWidth = `${maxWidth}px`;
    this.element.style.maxHeight = `${height}px`;
    this.element.style.overflow = 'auto';

    let prevScrollTop = -1;
    this.element.addEventListener('scroll', evt => {
      const { isPending, loaded } = this;
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

  fields() {
    const table = this.sourceTable();
    return this.columns.map(column => ({ column, table }));
  }

  fieldInfo(info) {
    this.schema = info;

    const thead = this.head;
    thead.innerHTML = '';
    const tr = document.createElement('tr');
    for (const { column } of info) {
      const th = document.createElement('th');
      th.addEventListener('click', evt => this.sort(evt, column));
      th.appendChild(document.createElement('span'));
      th.appendChild(document.createTextNode(column));
      tr.appendChild(th);
    }
    thead.appendChild(tr);

    // get column formatters
    this.formats = formatof(this.format, info);

    // get column alignment style
    this.style.innerText = tableCSS(
      this.id,
      alignof(this.align, info),
      widthof(this.widths, info)
    );

    return this;
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
