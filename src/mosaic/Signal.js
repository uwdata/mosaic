export function isSignal(x) {
  return x instanceof Signal;
}

export class Signal {
  constructor(name, value) {
    this._name = name;
    this._value = value;
    this._listeners = [];
  }

  get name() {
    return this._name;
  }

  get value() {
    return this._value;
  }

  update(value) {
    if (this._value !== value) {
      this._value = value;
      this.emit(this.value);
    }
    return this;
  }

  resolve(clause) {
    const clauses = (this._value || [])
      .filter(entry => entry.source !== clause.source);
    clauses.push(clause);
    this.update(clauses);
  }

  addListener(callback) {
    if (this._listeners.indexOf(callback) < 0) {
      this._listeners.push(callback);
    }
  }

  removeListener(callback) {
    this._listeners = this._listeners.filter(x => x !== callback);
  }

  emit(event) {
    this._listeners.forEach(l => l(event));
  }
}
