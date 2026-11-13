import type * as mc from '@uwdata/mosaic-core';

interface Options {
  filterBy?: mc.Selection;
  optimize?: boolean;
}

export function from(table: string | mc.Param<string>, options: Options = {}): { table: string | mc.Param<string>; options: Options } {
  return { table, options };
}
