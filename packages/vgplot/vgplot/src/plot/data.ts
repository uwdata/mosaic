import type * as mc from '@uwdata/mosaic-core';
import type * as msql from '@uwdata/mosaic-sql';

interface Options {
  filterBy?: mc.Selection;
  optimize?: boolean;
}

export function from(table: string | mc.Param<string> | msql.TableRefNode, options: Options = {}): { table: string | mc.Param<string> | msql.TableRefNode; options: Options; } {
  return { table, options };
}
