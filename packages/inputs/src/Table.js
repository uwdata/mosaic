import { MosaicClient } from '@uwdata/mosaic-core';
import { Query, column, desc } from '@uwdata/mosaic-sql';
import { formatDate, formatLocaleAuto, formatLocaleNumber } from './util/format.js';

let _id = -1;

export class Table extends MosaicClient {
  constructor({
    filterBy,
    from,
    columns = ['*'],
    format,
    rowBatch = 100,
    width,
    height = 500
  } = {}) {
    super(filterBy);
    this.id = `table-${++_id}`;
    this.from = from;
    this.columns = columns;
    this.format = format;
    this.offset = 0;
    this.limit = +rowBatch;
    this.pending = false;

    this.sortHeader = null;
    this.sortColumn = null;
    this.sortDesc = false;

    this.element = document.createElement('div');
    this.element.setAttribute('id', this.id);
    this.element.value = this;
    if (width) {
      this.element.style.maxWidth = `${width}px`;
    }
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
        this.offset += this.limit;
        const query = this.queryInternal(this.filterBy?.predicate(this));
        this.requestQuery(query);
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

  fields() {
    return this.columns.map(name => column(this.from, name));
  }

  fieldStats(stats) {
    this.stats = stats;

    const thead = this.head;
    thead.innerHTML = '';
    const tr = document.createElement('tr');
    for (const { column } of stats) {
      const th = document.createElement('th');
      th.addEventListener('click', evt => this.sort(evt, column));
      th.appendChild(document.createElement('span'));
      th.appendChild(document.createTextNode(column));
      tr.appendChild(th);
    }
    thead.appendChild(tr);

    // get column formatters
    this.formats = formatof(this.format, stats);

    // get column alignment style
    this.style.innerText = tableCSS(this.id, alignof({}, stats));

    return this;
  }

  query(filter) {
    this.offset = 0;
    return this.queryInternal(filter);
  }

  queryInternal(filter = []) {
    const { from, limit, offset, stats, sortColumn, sortDesc } = this;
    return Query.from(from)
      .select(stats.map(s => s.column))
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
    const { body, formats, data, stats, limit } = this;
    const nf = stats.length;

    let count = 0;
    for (const row of data) {
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
    const query = this.query(this.filterBy?.predicate(this));
    this.requestQuery(query);
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
