let _id = 0;

export class Search {
  constructor(options = {}) {
    this.id = 'search_' + (++_id);
    this.options = { ...options };
    if (options.field && options.fields) {
      throw new Error(`Search field and fields options are mutually exclusive.`);
    }
    if (options.field) {
      this.options.fields = [options.field];
    }
    this.signal = options.as;

    this.element = document.createElement('div');
    this.element.value = this;

    if (this.options.label) {
      const label = document.createElement('label');
      label.setAttribute('for', this.id);
      label.innerText = this.options.label;
      this.element.appendChild(label);
    }

    this.searchbox = document.createElement('input');
    this.searchbox.setAttribute('id', this.id);
    this.searchbox.setAttribute('type', 'text');
    this.searchbox.setAttribute('placeholder', 'Query');
    this.element.appendChild(this.searchbox);

    if (this.signal) {
      this.searchbox.addEventListener('input', () => {
        const query = this.searchbox.value;
        this.signal.resolve({
          source: this,
          field: this.options.fields[0],
          type: this.options.type || 'prefix',
          value: query
        });
      });
    }
  }

  update() {
    return this;
  }

  stats(data) {
    this._stats = data;
    return this;
  }

  data(data) {
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

  filter() {
    return this.options.filterBy;
  }

  fields() {
    const { table, fields } = this.options;
    if (table) {
      return fields.map(field => ({ table, field }));
    } else {
      return null;
    }
  }

  query() {
    const { table, fields } = this.options;
    return table ? {
      from: [table],
      select: {
        list: { field: fields[0], distinct: true }
      }
    } : null;
  }

  addSelection(sel) {
    this.selections.push(sel);
  }
}
