import type { Table, TypeMap, ValueArray } from '@uwdata/flechette';
import type * as mc from '@uwdata/mosaic-core';

import type { Arrayish } from './array.js';

export interface DataColumns<T extends TypeMap = TypeMap> {
  numRows: number;
  columns: { [P in keyof T]: ValueArray<T[P]>; };
}

export interface FromOptions {
  filterBy?: mc.Selection;
  optimize?: boolean;
  unnest?: string | string[];
}

export interface From {
  table: string | mc.Param<string>;
  options: FromOptions;
}

interface Column<T> {
  toArray(): ValueArray<T> | undefined;
}

export interface ArrowTable<T extends TypeMap = TypeMap> {
  readonly numRows: number;
  readonly schema: { readonly fields: { readonly name: string; }[]; };
  getChildAt<R extends T[keyof T]>(index: number): Column<R> | undefined;
}

type Row = Record<string, unknown>;
type Rows = Row[];
type Values = unknown[];

//Don't use `ValueArray` here because `string` satisfies it
type ColumnsIn<T extends TypeMap = TypeMap> = { [P in keyof T]: Array<T[P]>; };

type ColumnsOut<T extends TypeMap = TypeMap> = { [P in keyof T]: Arrayish<T[P]>; };

export type FromData = From | Rows | Table | ArrowTable | Values | ColumnsIn;

function isArrowTable<T extends TypeMap = TypeMap>(values: unknown): values is Table<T> | ArrowTable<T> {
  // @ts-expect-error check property of unknown value
  return (typeof values?.getChildAt) === 'function';
}

//TODO @dangotbanned: Replace with `fromArrow`
export function tableColumns<T extends TypeMap = TypeMap>(data: unknown): DataColumns<T> {
  if (!(isArrowTable<T>(data))) {
    throw new Error('Unrecognized data format.');
  }

  if ('toColumns' in data) {
    return { numRows: data.numRows, columns: data.toColumns() };
  }

  const { numRows, schema } = data;
  const columns = {} as any;
  schema.fields.forEach(({ name }, i) => {
    columns[name] = (data.getChildAt(i)?.toArray() ?? []);
  });

  return { numRows, columns };
}

function inline(data: any[], allowEmpty: boolean = false): InlineValues | InlineColumns {
  const numRows = data.length;
  if (!numRows) {
    if (allowEmpty) {
      return new InlineValues(0, []);
    }
    throw noDataError(data);
  }
  const row1 = data[0];
  if (typeof row1 === 'object') {
    return InlineColumns.fromRecords(Object.keys(row1), data);
  }
  return new InlineValues(numRows, data);
}

function isFrom(data: object): data is From {
  return 'table' in data && !Array.isArray(data.table);
}

export function source(data: FromData, allowEmpty: boolean = false): InlineSource<ColumnsOut | Values> | TableSource<string | mc.Param<string>> {
  if (Array.isArray(data)) {
    return inline(data, allowEmpty);
  }
  if (!(data && typeof data === 'object')) {
    throw new TypeError(`Invalid data source: ${data}`);
  }
  if (isFrom(data)) {
    const { table, options: { filterBy, optimize, unnest } } = data;
    const unnestNames = typeof unnest === 'string' ? [unnest] : unnest;
    return typeof table === 'string' ? new TableString(table, filterBy, optimize, unnestNames) : new TableParam(table, filterBy, optimize, unnestNames);
  }
  if (isArrowTable(data)) {
    return InlineColumns.fromArrow(data);
  }

  const names = Object.keys(data);
  if (!names.length) {
    throw new TypeError(`Invalid data source: ${data}`);
  }
  return new InlineColumns(data[names[0]].length, data);
}

/**Any kind of data source for a Mark.*/
abstract class Source<Name extends string | undefined> {
  /**`Mark.sourceTable` */
  abstract tableName(): Name;
}

/**A data source that participates in `Mark.{prepare,query}`.*/
abstract class TableSource<T extends string | mc.Param<string>> extends Source<string> {
  constructor(
    /**`Mark.source.table` */
    readonly table: T,
    /**`Mark.{filterBy,_filterBy,source.options.filterBy}` */
    readonly filterBy: mc.Selection = undefined,
    /**`Mark.source.options.optimize` */
    readonly optimize: boolean = true,
    /**`Mark.unnestFields` */
    readonly unnest: string[] = []
  ) { super(); }
}

class TableParam extends TableSource<mc.Param<string>> {
  // `this.table` goes to `Mark.params`
  tableName(): string { return this.table.value; }
}

class TableString extends TableSource<string> {
  tableName(): string { return this.table; }
}

/**
 * An inline data source, which bypasses most of Mosaic.
 * 
 * Represents `Mark.hasOwnData() === true`.
*/
abstract class InlineSource<D> extends Source<undefined> {
  constructor(readonly numRows: number) { super(); }
  abstract get data(): D;
  tableName(): undefined { return; }
}

class InlineColumns<T extends TypeMap = TypeMap> extends InlineSource<ColumnsOut<T>> {
  constructor(readonly numRows: number, readonly columns: ColumnsOut<T>) { super(numRows); }
  get data(): ColumnsOut<T> { return this.columns; }

  static fromArrow<F extends TypeMap>(table: ArrowTable<F> | Table<F>): InlineColumns<F> {
    if ('toColumns' in table) {
      return InlineColumns.fromFlechette(table);
    }
    const { numRows, schema: { fields } } = table;
    const columns = {} as any;
    fields.forEach(({ name }, i) => { columns[name] = (table.getChildAt(i)?.toArray() ?? []); });
    return new InlineColumns<F>(numRows, columns);
  }

  static fromFlechette<F extends TypeMap>(table: Table<F>): InlineColumns<F> {
    // Requires a cast due to upstream typing
    return new InlineColumns(table.numRows, table.toColumns() as ColumnsOut<F>);
  }

  //TODO @dangotbanned: can this be typed better?
  static fromRecords(names: string[], rows: Row[]): InlineColumns {
    function* values(name: string): Iterable<unknown> {
      for (const row of rows) {
        yield row[name];
      }
    }
    const from = Array.from;
    const columns = Object.fromEntries(names.map(name => [name, from(values(name))] as const));
    return new InlineColumns(rows.length, columns);

  }
}

class InlineValues extends InlineSource<Values> {
  constructor(readonly numRows: number, readonly values: Values) { super(numRows); }
  get data(): Values { return this.values; }
}

function noDataError(data: unknown): TypeError {
  return new TypeError(`This context does not support specifying empty inline arrays, got: ${data}.\n
Hints:
- If data is not required for this mark, omit this argument
- If data is required, but this represents a 0-row result, spell it as '{column_1: [], ..., column_n: []}'`
  );
}