import type { Table, TypeMap, ValueArray } from '@uwdata/flechette';

export interface DataColumns<T extends TypeMap = TypeMap> {
  numRows: number;
  columns: { [P in keyof T]: ValueArray<T[P]>; };
}


function isArrowTable<T extends TypeMap = TypeMap>(values: unknown): values is Table<T> {
  // @ts-expect-error check property of unknown value
  return (typeof values?.getChildAt) === 'function';
}

export function tableColumns<T extends TypeMap = TypeMap>(data: unknown): DataColumns<T> {
  if (!(isArrowTable<T>(data))) {
    throw new Error('Unrecognized data format.');
  }

  if ('toColumns' in data) {
    return { numRows: data.numRows, columns: data.toColumns() };
  }

  // TODO @dangotbanned: Add a test for non-fletchette and type it that way
  // Has type 'never' because `isArrowTable` only knows about fletchette
  // apache-arrow tables from third-party connectors lack toColumns()
  const arrowOther = data as Table<T>;
  const { numRows, schema } = arrowOther;
  const columns = {} as any;
  schema.fields.forEach(({ name }, i) => {
    columns[name] = (arrowOther.getChildAt(i)?.toArray() ?? []);
  });

  return { numRows, columns };
}