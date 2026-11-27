// oxlint-disable class-methods-use-this
import { MosaicClient } from '@uwdata/mosaic-core';
import type * as mc from '@uwdata/mosaic-core';
import type * as msql from '@uwdata/mosaic-sql';
import { isAggregateExpression, isColumnRef, Query, unnest } from '@uwdata/mosaic-sql';

import { mapGetOrInsertLazy } from '../collections.js';
import {
  type From,
  source as fromSource,
  type TableSource,
  fromArrow,
  type Table,
  type InlineColumns,
} from '../data.js';
import { map } from '../itertools.js';
import type { Plot } from '../plot.js';
import { BinTransformNode } from '../transforms/bin.js';
import type { MarkType } from '../types.js';
import type { MarkOptions, OptionName } from './options.js';
import {
  OptionsImpl,
  type ChannelKey,
  type FieldEntry,
  type ObjectValueEntry,
  type ValueEntry,
} from './parse.js';

export type Requirements<T extends MarkOptions> = Partial<Record<OptionName<T>, mc.Stat[]>>;

type Entry = ValueEntry | ObjectValueEntry | FieldEntry;
type Channels = Map<ChannelKey, Entry>;

type AtLeast2<T> = [T, T, ...T[]];

/**
 * Decide what terminates a search in {@link Mark2.channelFieldInexact}.
 *
 * - `'field'` - current behavior on `main`, where we continue if a channel exists but is not a field
 * - `'channel'` - only the first channel that exists is tested if it is a field
 *
 *   - Cheaper as it can stop early
 *   - Implementing this speculatively, may remove later if unused or another case emerges
 */
type Inexact = 'first-field' | 'first-channel';

function isField(entry: Entry): entry is FieldEntry {
  return 'field' in entry;
}

function markQuery(channels: Channels, table: string): msql.SelectQuery {
  // - `markQuery(..., skip)` is only used by `Density1DMark`
  //   - Not going to do that yet, pretending it doesn't exist
  // - `channel: 'orderby' (uwdata/mosaic#266) is handled here
  //   - `Highlight` adds that during `configureMark`
  const q = Query.from({ source: table });
  const dims = new Set<string>();
  let aggr = false;
  for (const entry of channels.values()) {
    if (isField(entry)) {
      const { field, as } = entry;
      if (isAggregateExpression(field)) {
        aggr = true;
      } else {
        if (dims.has(as)) {
          // oxlint-disable-next-line no-continue
          continue;
        }
        dims.add(as);
      }
      q.select({ [as]: field });
    }
  }
  return aggr ? q.groupby([...dims]) : q;
}

/**
 * Return a closure that unnests only fields named in `targets`, passing through all other entries
 * unchanged.
 */
function unnestTargets(
  targets: Iterable<string>,
): ([c, e]: [ChannelKey, Entry]) => [ChannelKey, Entry] {
  const names = new Set(targets);
  return ([c, e]: [ChannelKey, Entry]): [ChannelKey, Entry] => {
    const expanded =
      isField(e) && isColumnRef(e.field) && names.has(e.field.column)
        ? { as: e.as, field: unnest(e.field) }
        : e;
    return [c, expanded];
  };
}

function newSet<T>(): Set<T> {
  return new Set<T>();
}

/** Experimenting with a more precise `Mark` data model. */
export class Mark2<O extends MarkOptions = MarkOptions> extends MosaicClient {
  /** Inline data is not going to be modeled (at least for now) */
  readonly source: TableSource<string | mc.Param<string>> | undefined;
  private params: Set<mc.Param<any>>;
  public channels: Channels;
  private channelsExtra: Map<string, FieldEntry> | undefined;

  public data?: InlineColumns;

  /**
   * `Mark.plot` and `Mark.index` are both required, but this is not visible due to multi-stage
   * initialization.
   *
   * ```ts
   * mark(type, data, options);
   * (plot) => plot.addMark(new Mark(type, data, options));
   * mark.setPlot(plot, index);
   * plot.addParams(mark, mark.params);
   * ```
   */
  public plot?: Plot;
  public index?: number;

  protected static parser: OptionsImpl = new OptionsImpl({
    supportsParam: new Set([
      'reverse',
      'facet',
      'facetAnchor',
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'ariaDescription',
      'ariaHidden',
      'pointerEvents',
      'clip',
      'dx',
      'dy',
      'fill', // Param & SQLNode & Object
      'fillOpacity', // Param & SQLNode & Object
      'stroke', // Param & SQLNode & Object
      'strokeDasharray',
      'strokeDashoffset',
      'strokeLinecap',
      'strokeLinejoin',
      'strokeMiterlimit',
      'mixBlendMode',
      'imageFilter',
      'paintOrder',
      'shapeRendering',
      'target',
      'tip', // Param & Object
    ]),
    //There's a small intersection w/ the above
    supportsSQLNode: new Set([
      'filter',
      'sort', // SQLNode & Object
      'fx',
      'fy',
      'ariaLabel',
      'title',
      'fill', // Param & SQLNode & Object
      'fillOpacity', // Param & SQLNode & Object
      'stroke', // Param & SQLNode & Object
      'strokeOpacity', // SQLNode & Object
      'strokeWidth', // SQLNode & Object
      'opacity', // SQLNode & Object
      'href',
    ]),
    supportsObject: new Set([
      'sort', // SQLNode & Object
      'channels',
      'fill', // Param & SQLNode & Object
      'fillOpacity', // Param & SQLNode & Object
      'stroke', // Param & SQLNode & Object
      'strokeOpacity', // SQLNode & Object
      'strokeWidth', // SQLNode & Object
      'opacity', // SQLNode & Object
      'tip', // Param & Object
    ]),
  });

  constructor(
    public type: MarkType,
    source: From | undefined,
    options: O = {} as O,
    public reqs: Requirements<O> = {},
  ) {
    super(source?.options?.filterBy);
    this.source = undefined;
    const params = new Set<mc.Param<any>>();
    if (source) {
      this.source = fromSource(source);
      if (typeof this.source.table !== 'string') {
        params.add(this.source.table);
      }
    }

    /**
     * [`new.target`][1] is quite funky syntax that allows emulating Python's [`@classmethod`][2].
     *
     * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target#value
     *
     * [2]: https://docs.python.org/3/builtins/functions.html#classmethod
     *
     * Here, `new.target.parser` _can_ refer to an overriden `static parser`, but otherwise falls
     * back to `Mark.parser`:
     *
     * ```ts
     * new.target.parser  // ts
     * ```
     *
     * ```python
     * type(self).parser  # python
     * ```
     */

    const result = new.target.parser.parseOptionsFor(this, options, params);
    this.params = result.params;
    this.channels = result.channels;
    this.channelsExtra = result.channelsExtra;
  }

  setPlot(plot: Plot, index: number): void {
    this.plot = plot;
    this.index = index;
    //@ts-expect-error
    plot.addParams(this, this.params);
    if (this.source) {
      this.queryPending();
    }
  }

  sourceTable(): string | undefined {
    return this.source?.tableName();
  }

  queryPending(): this {
    //@ts-expect-error
    this.plot?.pending(this);
    return this;
  }

  queryResult(data: Table): this {
    this.data = fromArrow(data);
    return this;
  }

  update(): Promise<void> {
    //@ts-expect-error
    return this.plot?.update(this);
  }

  async prepare(): Promise<void> {
    const { source, channels, reqs } = this;
    if (!source) {
      return;
    }

    const nodesStats = new Map<msql.SQLNode, Set<mc.Stat>>();

    for (const [channel, entry] of channels.entries()) {
      if (isField(entry)) {
        const { field } = entry;
        // On main there's a fiddly bit of code that is only reachable via `BinTransform.stats`
        if (field instanceof BinTransformNode) {
          const { column } = field;
          const { stats } = field.stats;
          const columnStats = mapGetOrInsertLazy(nodesStats, column, newSet<mc.Stat>);
          for (const stat of stats) {
            columnStats.add(stat);
          }
          const requires = reqs[channel as OptionName<O>];
          if (requires) {
            for (const req of requires) {
              columnStats.add(req);
            }
          }
        } else {
          // This path doesn't need to do most of those steps
          throw new Error('prepare() is not yet implemented');
        }
      }
    }
    throw new Error('prepare() is not yet implemented');
  }

  public query(filter: msql.FilterExpr = []): msql.SelectQuery | undefined {
    const { source } = this;
    if (!source) {
      return;
    }
    const { unnest: targets } = source;
    const channels = targets.length
      ? new Map(map(this.channels.entries(), unnestTargets(targets)))
      : this.channels;
    return markQuery(channels, source.tableName()).where(filter);
  }

  channel(name: ChannelKey): Entry | undefined {
    return this.channels.get(name) ?? this.channelsExtra.get(name);
  }

  channelField(name: ChannelKey): FieldEntry | undefined {
    const c = this.channel(name);
    return c && isField(c) ? c : undefined;
  }

  /**
   * A replacement for `Mark.channelField(names, { exact = false })`.
   *
   * ## What was wrong before?
   *
   * - Default behavior would scan the list twice per `channel`, the second time permitting a
   *   `startsWith` match.
   *
   *   - The default should've been the more performant option
   * - User-defined channels were included in the search
   *
   *   - Seems unintentional, and that `startsWith` was a shortcut to `'x'` -> `'x'`, `'x1'`, `'x2'`
   * - The failure case for a channel that exists but is not a field, and nonexistent channels are not
   *   distinguishable
   * - **Many** use cases will loop over `names` from the outside
   *
   * ## Solution
   *
   * - A distinct method, with a more awkward name that makes it clear you may want to take a closer
   *   look
   * - No usage of substring matching
   * - User-defined channels don't participate
   * - You must pass in a list of at-least 2 names, and they all must be be possible in `MarkOptions`
   *
   *   - There is no reason to call with a single name
   *   - If the channel isn't an option on the `Mark`, you should be warned that you're wasting time
   *     searching for it
   * - `how` can be provided to change what terminates the search
   */
  channelFieldInexact(
    names: AtLeast2<OptionName<O>>,
    how: Inexact = 'first-field',
  ): FieldEntry | undefined {
    const { channels } = this;
    if (how === 'first-field') {
      for (const name of names) {
        const c = channels.get(name);
        if (c && isField(c)) {
          return c;
        }
      }
    } else {
      for (const name of names) {
        const c = channels.get(name);
        if (c) {
          return isField(c) ? c : undefined;
        }
      }
    }
  }
}
