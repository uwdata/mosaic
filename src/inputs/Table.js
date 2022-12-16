import { Signal } from '../mosaic/Signal.js';

export class Table {
  constructor(options = {}) {
    this.options = { ...options };
    this.offset = 0;
    this.limit = 500;
    this.nrows = -1;
    this.rows = 0;
    this.request = new Signal('query');
    this.pending = false;

    this.element = document.createElement('div');
    this.element.value = this;
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
    this.table.style.position = 'relative';
    this.element.appendChild(this.table);

    this.head = document.createElement('thead');
    this.table.appendChild(this.head);

    this.body = document.createElement('tbody');
    this.table.appendChild(this.body);
  }

  filter() {
    return this.options.filterBy;
  }

  fields() {
    const { table, fields = ['*'] } = this.options;
    if (table) {
      return fields.map(field => ({ table, field }));
    } else {
      return null;
    }
  }

  stats(data) {
    this._stats = data;

    const thead = this.head;
    thead.innerHTML = '';
    const tr = document.createElement('tr');
    for (const { field } of data) {
      const th = document.createElement('th');
      th.innerText = field;
      tr.appendChild(th);
    }
    thead.appendChild(tr);

    return this;
  }

  data(data, fromRequest) {
    if (!fromRequest) {
      // data not from an internal request, so reset table
      this.loaded = false;
      this.body.innerHTML = '';
    }
    this._data = data;
    return this;
  }

  update() {
    const fields = this._stats;
    const body = this.body;

    let count = 0;
    for (const row of this._data) {
      ++count;
      const tr = document.createElement('tr');
      for (const field of fields) {
        const td = document.createElement('td');
        td.innerText = row[field.field];
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }

    if (count < this.limit) {
      // data table has been fully loaded
      this.loaded = true;
    }

    // throttle load-on-scroll requests
    setTimeout(() => this.pending = false, 100);

    return this;
  }

  query() {
    this.offset = 0;
    return this.queryInternal();
  }

  queryInternal() {
    const { limit, offset, options, _stats } = this;
    const { table } = options;
    const fields = _stats.map(s => s.field);

    return table ? {
      from: [table],
      select: fields.reduce((o, field) => (o[field] = { field }, o), {}),
      offset,
      limit
    } : null;
  }
}
