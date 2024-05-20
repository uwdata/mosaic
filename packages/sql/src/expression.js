import { literalToSQL } from './to-sql.js';

/**
 * @typedef {{
 *   value: any;
 *   addEventListener(type: string, callback: Function): any;
 *   column?: string,
 *   columns?: string[]
 * }} ParamLike
 */

/**
 * Test if a value is parameter-like. Parameters have addEventListener methods.
 * @param {*} value The value to test.
 * @returns {value is ParamLike} True if the value is param-like, false otherwise.
 */
export const isParamLike = value => typeof value?.addEventListener === 'function';

/**
 * Test if a value is a SQL expression instance.
 * @param {*} value The value to test.
 * @returns {value is SQLExpression} True if value is a SQL expression, false otherwise.
 */
export function isSQLExpression(value) {
  return value instanceof SQLExpression;
}

/**
 * Base class for all SQL expressions. Most callers should use the `sql`
 * template tag rather than instantiate this class.
 */
export class SQLExpression {

  /**
   * Create a new SQL expression instance.
   * @param {(string | ParamLike | SQLExpression | import('./ref.js').Ref)[]} parts The parts of the expression.
   * @param {string[]} [columns=[]] The column dependencies
   * @param {object} [props] Additional properties for this expression.
   */
  constructor(parts, columns, props) {
    this._expr = Array.isArray(parts) ? parts : [parts];
    this._deps = columns || [];
    this.annotate(props);

    const params = this._expr.filter(part => isParamLike(part));
    if (params.length > 0) {
      /** @type {ParamLike[]} */
      // @ts-ignore
      this._params = Array.from(new Set(params));
      this._params.forEach(param => {
        param.addEventListener('value', () => update(this, this.map?.get('value')));
      });
    } else {
      // do not support event listeners if not needed
      // this causes the expression instance to NOT be param-like
      this.addEventListener = undefined;
    }
  }

  /**
   * A reference to this expression.
   * Provides compatibility with param-like objects.
   */
  get value() {
    return this;
  }

  /**
   * The column dependencies of this expression.
   * @returns {string[]} The columns dependencies.
   */
  get columns() {
    const { _params, _deps } = this;
    if (_params) {
      // pull latest dependencies, as they may change across updates
      const pset = new Set(_params.flatMap(p => {
        const cols = p.value?.columns;
        return Array.isArray(cols) ? cols : [];
      }));
      if (pset.size) {
        const set = new Set(_deps);
        pset.forEach(col => set.add(col));
        return Array.from(set);
      }
    }
    // if no params, return fixed dependencies
    return _deps;
  }

  /**
   * The first column dependency in this expression, or undefined if none.
   * @returns {string} The first column dependency.
   */
  get column() {
    return this._deps.length ? this._deps[0] : this.columns[0];
  }

  /**
   * Annotate this expression instance with additional properties.
   * @param {object[]} [props] One or more objects with properties to add.
   * @returns This SQL expression.
   */
  annotate(...props) {
    return Object.assign(this, ...props);
  }

  /**
   * Generate a SQL code string corresponding to this expression.
   * @returns {string} A SQL code string.
   */
  toString() {
    return this._expr
      .map(p => isParamLike(p) && !isSQLExpression(p) ? literalToSQL(p.value) : p)
      .join('');
  }

  /**
   * Add an event listener callback for the provided event type.
   * @param {string} type The event type to listen for (for example, "value").
   * @param {(a: SQLExpression) => Promise?} callback The callback function to
   *  invoke upon updates. A callback may optionally return a Promise that
   *  upstream listeners may await before proceeding.
   */
  addEventListener(type, callback) {
    const map = this.map || (this.map = new Map());
    const set = map.get(type) || (map.set(type, new Set), map.get(type));
    set.add(callback);
  }
}

function update(expr, callbacks) {
  if (callbacks?.size) {
    return Promise.allSettled(Array.from(callbacks, fn => fn(expr)));
  }
}

export function parseSQL(strings, exprs) {
  const spans = [strings[0]];
  const cols = new Set;
  const n = exprs.length;
  for (let i = 0, k = 0; i < n;) {
    const e = exprs[i];
    if (isParamLike(e)) {
      spans[++k] = e;
    } else {
      if (Array.isArray(e?.columns)) {
        e.columns.forEach(col => cols.add(col));
      }
      spans[k] += typeof e === 'string' ? e : literalToSQL(e);
    }
    const s = strings[++i];
    if (isParamLike(spans[k])) {
      spans[++k] = s;
    } else {
      spans[k] += s;
    }
  }

  return { spans, cols: Array.from(cols) };
}

/**
 * Tag function for SQL expressions. Interpolated values
 * may be strings, other SQL expression objects (such as column
 * references), or parameterized values.
 */
export function sql(strings, ...exprs) {
  const { spans, cols } = parseSQL(strings, exprs);
  return new SQLExpression(spans, cols);
}
