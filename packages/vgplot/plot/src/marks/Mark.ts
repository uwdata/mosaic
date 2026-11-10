import type { SelectQuery } from '@uwdata/mosaic-sql'
import type { DataColumns } from '@uwdata/mosaic-core'
import type { Table } from '@uwdata/flechette';
import type * as msql from '@uwdata/mosaic-sql'
import type * as mc from '@uwdata/mosaic-core';
import { isParam, MosaicClient, queryFieldInfo, toDataColumns } from '@uwdata/mosaic-core';
import { Query, collectParams, column, isAggregateExpression, isColumnParam, isColumnRef, isNode, isParamLike, unnest } from '@uwdata/mosaic-sql';
import { isColor } from './util/is-color.js';
import { isConstantOption, type ConstantOption } from './util/is-constant-option.js';
import { isSymbol } from './util/is-symbol.js';
import { Transform } from '../symbols.js';
import type { Plot } from '../plot.js';
import type { ChannelName } from './util/channel-scale.js';


type EncodingName = ChannelName | ConstantOption | 'orderby'; // (uwdata/mosaic#266)
type Encodings = { [name in EncodingName]?: any };
type Reqs = { [name in EncodingName]?: mc.Stat[] };

/** `channels: Entry[]` is being used to describe every possible input that is not `data` or `type: MarkType`.
 * 
 * For example, {@link markQuery} anticipates `channel: 'orderby'` - which is a property of a transform (`WindowOptions.orderby`).
 */
interface Entry {
  channel: EncodingName;
  value?: any;
  field?: { stats?: { stats?: mc.Stat[], column?: mc.FieldRef } } | msql.ExprValue | msql.ColumnRefNode | msql.ColumnParamNode | msql.SQLNode;
  as?: string;
  type?: string;
  min?: any;
  max?: any;
}


function isColorChannel(channel: string): channel is 'stroke' | 'fill' {
  return channel === 'stroke' || channel === 'fill';
}
function isOpacityChannel(channel: string): channel is 'opacity' | 'fillOpacity' | 'strokeOpacity' {
  return /opacity$/i.test(channel);
}
function isSymbolChannel(channel: string): channel is 'symbol' {
  return channel === 'symbol';
}

// column name for a plain column reference or name string, else null
function unnestableColumn(field: unknown): string | null {
  return isColumnRef(field) ? field.column
    : typeof field === 'string' ? field
      : null;
}

// TODO @dangotbanned: Typeguard?
function isFieldObject(channel: string, field: unknown): boolean {
  return channel !== 'sort' && channel !== 'tip'
    && field != null && !Array.isArray(field);
}
function fieldEntry(channel: EncodingName, field: msql.ColumnRefNode | msql.ColumnParamNode | msql.SQLNode): Entry {
  return ({
    channel,
    field,
    as: isColumnRef(field) && !isColumnParam(field) ? field.column : channel
  });
}

// checks if a data source is an explicit array of values
// as opposed to a database table reference
export function isDataArray(source: unknown): source is any[] {
  return Array.isArray(source);
}

/**TODO @dangotbanned: Move the def in `vgplot` here and re-export*/
type MarkType = string;


interface PlotMarkSpec {
  type: MarkType;
  data: any;
  options: Record<string, any>;
}

/**
 * The minimal mark surface consumed by interactors, allowing marks
 * and lightweight stand-ins to be used interchangeably.
 */
export interface InteractorMark {
  plot: Plot;
  data?: mc.DataColumns;
  index?: number;
  channels: Entry[]
  channelField: (channel: ChannelName, options?: { exact?: boolean; }) => ({ field?: any; as?: any; } | null | undefined);
  isUnnested: (field: any) => boolean;
  query(filter: msql.FilterExpr): msql.SelectQuery | null;
  get filterBy(): mc.Selection | undefined;
  get coordinator(): mc.Coordinator | null;
}


export class Mark extends MosaicClient implements InteractorMark {
  public plot: Plot;
  public data?: mc.DataColumns;
  public index?: number;
  public channels: Entry[];
  detail: Set<EncodingName>;
  params: Set<mc.Param<any>>;
  _fieldInfo?: boolean;

  constructor(public type: MarkType, public source: any, encodings: Encodings = {}, public reqs: Reqs = {}) {
    super(source?.options?.filterBy);

    const channels = this.channels = [];
    const detail = this.detail = new Set;
    const params = this.params = new Set;

    if (isDataArray(source)) {
      this.data = toDataColumns(source);
    } else if (isParam(source?.table)) {
      params.add(source.table);
    }

    const process = (channel: EncodingName | 'channels', entry: any): void => {
      const type = typeof entry;
      if (channel === 'channels') {
        for (const name in entry) {
          //@ts-expect-error `name` could be anything
          detail.add(name);
          //@ts-expect-error `name` could be anything
          process(name, entry[name]);
        }
      } else if (type === 'function' && entry[Transform]) {
        const enc = entry(this, channel);
        for (const key in enc) {
          //@ts-expect-error `key` could be anything
          process(key, enc[key]);
        }
      } else if (type === 'string') {
        if (
          isConstantOption(channel) ||
          isColorChannel(channel) && isColor(entry) ||
          isSymbolChannel(channel) && isSymbol(entry)
        ) {
          // interpret constants and color/symbol names as values, not fields
          channels.push({ channel, value: entry });
        } else {
          channels.push(fieldEntry(channel, column(entry)));
        }
      } else if (isParamLike(entry)) {
        const c = { channel, value: entry.value };
        channels.push(c);
        entry.addEventListener('value', value => {
          // update immediately, the value is simply passed to Plot
          c.value = value;
          return this.update();
        });
      } else if (isNode(entry)) {
        //@ts-expect-error `collectParams`  returns `ParamLike[]`, which is not the same as `Param[]`
        collectParams(entry).forEach(p => params.add(p));
        channels.push(fieldEntry(channel, entry))
      } else if (type === 'object' && isFieldObject(channel, entry)) {
        channels.push(fieldEntry(channel, entry));
      } else if (entry !== undefined) {
        channels.push({ channel, value: entry });
      }
    };

    for (const channel in encodings) {
      process(channel as EncodingName, encodings[channel]);
    }
  }


  setPlot(plot: Plot, index: number): void {
    this.plot = plot;
    this.index = index;
    plot.addParams(this, this.params);
    if (this.source?.table) this.queryPending();
  }

  sourceTable(): string | null {
    const table: mc.Param<string> | string | undefined = this.source?.table;
    return table ? (isParam(table) ? table.value : table) : null;
  }

  /**
   * The source field names to unnest, as declared by the `unnest` option.
   */
  get unnestFields(): string[] {
    const { unnest } = this.source?.options ?? {};
    return unnest == null ? [] : [unnest].flat();
  }

  /**
   * Check if the given field is unnested by this mark's source.
   * @param field A field reference or column name.
   */
  public isUnnested(field: any): boolean {
    const name = unnestableColumn(field);
    return name != null && this.unnestFields.includes(name);
  }

  hasOwnData(): boolean {
    return this.source == null || isDataArray(this.source);
  }

  hasFieldInfo(): boolean {
    return !!this._fieldInfo;
  }

  channel(channel: ChannelName): Entry | undefined {
    return this.channels.find(c => c.channel === channel);
  }

  public channelField(channel: ChannelName, { exact = false } = {}): Entry | null {
    const c = exact
      ? this.channel(channel)
      : this.channels.find(c => c.channel.startsWith(channel));
    return c?.field ? c : null;
  }

  async prepare(): Promise<null | undefined> {
    if (this.hasOwnData()) return null;

    const { channels, reqs } = this;
    const fields = new Map<any, Set<mc.Stat>>();
    for (const { channel, field } of channels) {
      if (!field) continue;
      //@ts-expect-error Property 'stats' does not exist on type 'string'
      const stats = field.stats?.stats || [];
      //@ts-expect-error Property 'stats' does not exist on type 'string'
      const key = field.stats?.column ?? field;
      const entry = fields.get(key) ?? fields.set(key, new Set).get(key);
      stats.forEach(s => entry.add(s));
      reqs[channel]?.forEach(s => entry.add(s));
    }

    const table = this.sourceTable();
    const info = await queryFieldInfo(
      this.coordinator,
      Array.from(fields, ([c, s]) => ({ table, column: c, stats: Array.from(s) }))
    );

    const lookup = Object.fromEntries(info.map(x => [x.column, x]));
    for (const entry of this.channels) {
      const { field } = entry;
      if (field) {
        //@ts-expect-error Property 'stats' does not exist on type 'string'
        Object.assign(entry, lookup[field.stats?.column ?? field]);
      }
    }
    this._fieldInfo = true;
  }

  /**
   * Return a query specifying the data needed by this Mark client.
   * @param filter The filtering criteria to apply in the query.
   * @returns The client query
   */
  public query(filter: msql.FilterExpr = []): msql.SelectQuery | null {
    if (this.hasOwnData()) return null;
    const { unnestFields } = this;
    // wrap unnested column fields in UNNEST() so arrays expand into rows
    const channels = unnestFields.length === 0
      ? this.channels
      : this.channels.map(c => {
        const name = unnestableColumn(c.field);
        return name != null && unnestFields.includes(name)
          ? { ...c, field: unnest(c.field) }
          : c;
      });
    return markQuery(channels, this.sourceTable()).where(filter);
  }

  queryPending(): this {
    this.plot.pending(this);
    return this;
  }

  /**
   * Provide query result data to the mark.
   */
  queryResult(data: Table | Record<string, unknown>[]): this {
    this.data = toDataColumns(data);
    return this;
  }

  update(): ReturnType<Plot['update']> {
    return this.plot.update(this);
  }

  /**
   * Generate an array of Plot mark specifications.
   */
  plotSpecs(): PlotMarkSpec[] {
    const { type, data, detail, channels } = this;
    return markPlotSpec(type, detail, channels, data);
  }
}

/**
 * Helper method for setting a channel option in a Plot specification.
 * Checks if a constant value or a data field is needed.
 * Also avoids misinterpretation of data values as color names.
 * @param c a visual encoding channel spec
 * @param columns named data column arrays
 * @returns the Plot channel option
 */
export function channelOption(c: Entry, columns?: { [as: string]: string }): { value: string, scale: 'color' | 'opacity' } | string {
  // use a scale override for color channels to sidestep
  // https://github.com/observablehq/plot/issues/1593
  const value = columns?.[c.as] ?? c.as;
  return Object.hasOwn(c, 'value') ? c.value
    : isColorChannel(c.channel) ? { value, scale: 'color' }
      : isOpacityChannel(c.channel) ? { value, scale: 'opacity' }
        : value;
}

/**
 * Default query construction for a mark.
 * Tracks aggregates by checking fields for an aggregate flag.
 * If aggregates are found, groups by all non-aggregate fields.
 * @param channels array of visual encoding channel specs.
 * @param table the table to query.
 * @param skip an optional array of channels to skip.
 *  Mark subclasses can skip channels that require special handling.
 * @returns a Query instance
 */
export function markQuery(channels: Entry[], table: any, skip: string[] = []): SelectQuery {
  const q = Query.from({ source: table });
  const dims = new Set<string>();
  let aggr = false;

  for (const { channel, field, as, value } of channels) {
    if (skip.includes(channel)) continue;
    if (channel === 'orderby') {
      q.orderby(value ?? field);
    } else if (field) {
      //@ts-expect-error Type 'string' is not assignable to type 'SQLNode'.
      if (isAggregateExpression(field)) {
        aggr = true;
      } else {
        if (dims.has(as)) continue;
        dims.add(as);
      }
      //@ts-expect-error `field` hasn't been narrowed and can be anything
      q.select({ [as]: field });
    }
  }

  if (aggr) {
    q.groupby(Array.from(dims));
  }

  return q;
}



/** Generate an array of Plot mark specifications.*/
export function markPlotSpec(type: any, detail: Set<EncodingName>, channels: Entry[], data: DataColumns, options: Record<string, any> = {}): PlotMarkSpec[] {
  //@ts-expect-error Property 'values', 'columns' does not exist on type 'DataColumns | {}'.
  const { numRows: length, values, columns } = data ?? {};

  // populate plot specification options
  const side: Record<string, any> = {};
  for (const c of channels) {
    const obj = detail.has(c.channel) ? side : options;
    obj[c.channel] = channelOption(c, columns);
  }
  if (detail.size) options.channels = side;

  // if provided raw source values (not objects) pass as-is
  // otherwise we pass columnar data directy in the options
  const specData = values ?? (data ? { length } : null);
  const spec = [{ type, data: specData, options }];
  return spec;
}
