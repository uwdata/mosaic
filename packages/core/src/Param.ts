import { AsyncDispatch } from './util/AsyncDispatch.js';
import { distinct } from './util/distinct.js';

/**
 * Test if a value is a Param instance.
 * @param x The value to test.
 * @returns True if the input is a Param, false otherwise.
 */
export function isParam(x: any): x is Param<any> {
  return x instanceof Param;
}

/**
 * Represents a dynamic parameter that dispatches updates
 * upon parameter changes.
 */
export class Param<T> extends AsyncDispatch {
  protected _value?: T;

  /**
   * Create a new Param instance.
   * @param value The initial value of the Param.
   */
  constructor(value?: T) {
    super();
    this._value = value;
  }

  /**
   * Create a new Param instance with the given initial value.
   * @param value The initial value of the Param.
   * @returns The new Param instance.
   */
  static value<T>(value: T): Param<T> {
    return new Param(value);
  }

  /**
   * Create a new Param instance over an array of initial values,
   * which may contain nested Params.
   * @param values The initial values of the Param.
   * @returns The new Param instance.
   */
  static array(values: any[]): Param<any> {
    if (values.some(v => isParam(v))) {
      const p = new Param();
      const update = (): void => {
        p.update(values.map(v => isParam(v) ? v.value : v));
      };
      update();
      values.forEach(v => isParam(v) ? v.addEventListener('value', update) : 0);
      return p;
    }
    return new Param(values);
  }

  /**
   * The current value of the Param.
   */
  get value(): any {
    return this._value;
  }

  /**
   * Update the Param value
   * @param value The new value of the Param.
   * @param options The update options.
   * @param options.force A boolean flag indicating if the Param
   *  should emit a 'value' event even if the internal value is unchanged.
   * @returns This Param instance.
   */
  update(value: any, { force }: { force?: boolean } = {}): this {
    const shouldEmit = distinct(this._value, value) || force;
    if (shouldEmit) {
      this.emit('value', value);
    } else {
      this.cancel('value');
    }
    return this;
  }

  /**
   * Upon value-typed updates, sets the current value to the input value
   * immediately prior to the event value being emitted to listeners.
   * @param type The event type.
   * @param value The input event value.
   * @returns The input event value.
   */
  willEmit(type: string, value: any): any {
    if (type === 'value') {
      this._value = value;
    }
    return value;
  }
}