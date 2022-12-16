export class Menu {
  constructor(options = {}) {
    this.options = { ...options };
    this.field = options.field;
    this.signal = options.as;

    this.element = document.createElement('div');
    this.element.setAttribute('class', 'input');
    this.element.value = this;

    const label = document.createElement('label');
    label.innerText = this.options.label || this.field;
    this.element.appendChild(label);

    this.select = document.createElement('select');
    this.element.appendChild(this.select);

    const opt = document.createElement('option');
    opt.setAttribute('value', '');
    opt.innerText = 'All';
    this.select.appendChild(opt);

    if (this.signal) {
      this.select.addEventListener('input', () => {
        const value = this.select.value;
        this.signal.resolve({
          source: this,
          field: this.field,
          type: 'equals',
          value: value || null
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
    for (const { value } of data) {
      const opt = document.createElement('option');
      opt.setAttribute('value', value);
      opt.innerText = value; // TODO: format labels
      this.select.appendChild(opt);
    }
    return this;
  }

  filter() {
    return this.options.filterBy;
  }

  fields() {
    const { table, field } = this.options;
    return table ? [{ table, field }] : null;
  }

  query() {
    const { table, field } = this.options;
    return table ? {
      from: [table],
      select: { value: { field, distinct: true } },
      order: [{ field }]
    } : null;
  }
}
