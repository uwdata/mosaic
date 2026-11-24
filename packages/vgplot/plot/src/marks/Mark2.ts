import { MosaicClient } from '@uwdata/mosaic-core';
import type * as mc from '@uwdata/mosaic-core';
import type * as msql from '@uwdata/mosaic-sql';
import { isColumnRef, unnest } from '@uwdata/mosaic-sql';

import { type From, source as fromSource, type TableSource } from '../data.js';
import { map } from '../itertools.js';
import type { Plot } from '../plot.js';
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

// oxlint-disable-next-line no-unused-vars
function markQuery(channels: Channels, table: string | undefined): msql.SelectQuery {
  throw new Error('TODO @dangotbanned: `markQuery` is not yet implemented');
}

function isField(entry: Entry): entry is FieldEntry {
  return 'field' in entry;
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

/** Experimenting with a more precise `Mark` data model. */
export class Mark2<O extends MarkOptions = MarkOptions> extends MosaicClient {
  /** Inline data is not going to be modeled (at least for now) */
  readonly source: TableSource<string | mc.Param<string>> | undefined;
  private params: Set<mc.Param<any>>;
  public channels: Channels;
  private channelsExtra: Map<string, FieldEntry> | undefined;

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
  update(): Promise<void> {
    //@ts-expect-error
    return this.plot?.update(this);
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

  channelField(_channel: string): any {
    throw new Error(
      `TODO @dangotbanned: replace ${this.channelField.name} with using a less ad-hoc data structure`,
    );
  }
}
