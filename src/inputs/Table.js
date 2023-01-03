import { Signal } from '../mosaic/Signal.js';
import { Query, column, desc } from '../sql/index.js';
import { formatDate, formatLocaleAuto, formatLocaleNumber } from './util/format.js';

let _id = -1;

export class Table {
  constructor(options = {}) {
    this.options = { ...options };
    this.offset = 0;
    this.limit = +this.options.rowBatch || 100;
    this.request = new Signal('query');
    this.pending = false;
    this.id = `table-${++_id}`;

    this.sortHeader = null;
    this.sortColumn = null;
    this.sortDesc = false;

    this.element = document.createElement('div');
    this.element.setAttribute('id', this.id);
    this.element.value = this;
    if (this.options.width) {
      this.element.style.maxWidth = `${this.options.width}px`;
    }
    this.element.style.maxHeight = `${this.options.height || 500}px`;
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
        this.offset += this.limit;
        this.request.update(this.queryInternal());
      }
    });

    this.table = document.createElement('table');
    this.element.appendChild(this.table);

    this.head = document.createElement('thead');
    this.table.appendChild(this.head);

    this.body = document.createElement('tbody');
    this.table.appendChild(this.body);

    this.style = document.createElement('style');
    this.element.appendChild(this.style);
  }

  filter() {
    return this.options.filterBy;
  }

  fields() {
    const { table, fields = ['*'] } = this.options;
    if (table) {
      return fields.map(field => column(table, field));
    } else {
      return null;
    }
  }

  stats(data) {
    this._stats = data;

    const thead = this.head;
    thead.innerHTML = '';
    const tr = document.createElement('tr');
    for (const { column } of data) {
      const th = document.createElement('th');
      th.addEventListener('click', evt => this.sort(evt, column));
      th.appendChild(document.createElement('span'));
      th.appendChild(document.createTextNode(column));
      tr.appendChild(th);
    }
    thead.appendChild(tr);

    // get column formatters
    this.formats = formatof(this.options.format, data);

    // get column alignment style
    this.style.innerText = tableCSS(this.id, alignof({}, data));

    return this;
  }

  data(data) {
    if (!this.pending) {
      // data is not from an internal request, so reset table
      this.loaded = false;
      this.body.innerHTML = '';
    }
    this._data = data;
    return this;
  }

  update() {
    const { body, formats, _data, _stats: stats, limit } = this;
    const nf = stats.length;

    let count = 0;
    for (const row of _data) {
      ++count;
      const tr = document.createElement('tr');
      for (let i = 0; i < nf; ++i) {
        const value = row[stats[i].column];
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

  query(filter) {
    this.offset = 0;
    return this.queryInternal(filter);
  }

  queryInternal(filter = []) {
    const { limit, offset, options, _stats, sortColumn, sortDesc } = this;
    const { table } = options;
    if (!table) return null;

    return Query.from(table)
      .select(_stats.map(s => s.column))
      .where(filter)
      .orderby(sortColumn ? (sortDesc ? desc(sortColumn) : sortColumn) : [])
      .limit(limit)
      .offset(offset);
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
    this.request.update(this.query());
  }
}

function formatof(base = {}, stats, locale) {
  return stats.map(({ column, type }) => {
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

function alignof(base = {}, stats) {
  return stats.map(({ column, type }) => {
    if (column in base) {
      return base[column];
    } else if (type === 'number') {
      return 'right';
    } else {
      return 'left';
    }
  });
}

function tableCSS(id, align) {
  const styles = [];
  align.forEach((a, i) => {
    if (a !== 'left') {
      styles.push(`#${id} tr>:nth-child(${i+1}) {text-align:${a}}`);
    }
  });
  return styles.join(' ');
}
