import { MosaicClient, coordinator } from '@uwdata/mosaic-core';
import { Query, column, desc } from '@uwdata/mosaic-sql';
import { formatDate, formatLocaleAuto, formatLocaleNumber } from './util/format.js';
import { input } from './input.js';

let _id = -1;

export const table = options => input(Table, options);

export class Table extends MosaicClient {
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
  } = {}) {
    super(filterBy);
    this.id = `table-${++_id}`;
    this.from = from;
    this.columns = columns;
    this.format = format;
    this.align = align;
    this.widths = typeof width === 'object' ? width : {};

    this.offset = 0;
    this.limit = +rowBatch;
    this.pending = false;

    this.sortHeader = null;
    this.sortColumn = null;
    this.sortDesc = false;

    this.element = element || document.createElement('div');
    this.element.setAttribute('id', this.id);
    this.element.value = this;
    if (typeof width === 'number') this.element.style.width = `${width}px`;
    if (maxWidth) this.element.style.maxWidth = `${maxWidth}px`;
    this.element.style.maxHeight = `${height}px`;
    this.element.style.overflow = 'auto';

    let prevScrollTop = -1;
    this.element.addEventListener('scroll', evt => {
      const { pending, loaded } = this;
      const { scrollHeight, scrollTop, clientHeight } = evt.target;

      const back = scrollTop < prevScrollTop;
      prevScrollTop = scrollTop;
      if (back || pending || loaded) return;

      if (scrollHeight - scrollTop < 2 * clientHeight) {
        this.pending = true;
        this.requestData(this.offset + this.limit);
      }
    });

    this.tbl = document.createElement('table');
    this.element.appendChild(this.tbl);

    this.head = document.createElement('thead');
    this.tbl.appendChild(this.head);

    this.body = document.createElement('tbody');
    this.tbl.appendChild(this.body);

    this.style = document.createElement('style');
    this.element.appendChild(this.style);
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
    return this.columns.map(name => column(this.from, name));
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
    const { from, limit, offset, schema, sortColumn, sortDesc } = this;
    return Query.from(from)
      .select(schema.map(s => s.column))
      .where(filter)
      .orderby(sortColumn ? (sortDesc ? desc(sortColumn) : sortColumn) : [])
      .limit(limit)
      .offset(offset);
  }

  queryResult(data) {
    if (!this.pending) {
      // data is not from an internal request, so reset table
      this.loaded = false;
      this.body.replaceChildren();
    }
    this.data = data;
    return this;
  }

  update() {
    const { body, formats, data, schema, limit } = this;
    const nf = schema.length;

    let count = 0;
    for (const row of data) {
      ++count;
      const tr = document.createElement('tr');
      for (let i = 0; i < nf; ++i) {
        const value = row[schema[i].column];
        const td = document.createElement('td');
        td.innerText = value == null ? '' : formats[i](value);
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }

    if (count < limit) {
      // data table has been fully loaded
      this.loaded = true;
    }

    this.pending = false;
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
