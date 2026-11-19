// oxlint-disable unicorn/no-nested-ternary
import { MosaicClient } from '@uwdata/mosaic-core';
import type * as mc from '@uwdata/mosaic-core';
import type * as msql from '@uwdata/mosaic-sql';
import { isColumnRef, unnest } from '@uwdata/mosaic-sql';

import { type From, source as fromSource, type TableSource } from '../data.js';
import type { Plot } from '../plot.js';
import type { MarkType } from '../types.js';
import { markQuery } from './Mark.js';
import type { MarkOptions, OptionName } from './options.js';
import { OptionsImpl, type FieldEntry } from './parse.js';

export type Requirements<T extends MarkOptions> = Partial<Record<OptionName<T>, mc.Stat[]>>;

/** Experimenting with a more precise `Mark` data model. */
export class Mark2<O extends MarkOptions = MarkOptions> extends MosaicClient {
  /** Inline data is not going to be modeled (at least for now) */
  readonly source: TableSource<string | mc.Param<string>> | undefined;
  private params: Set<mc.Param<any>>;
  public channels: object[];
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
    Object.assign(this, result);
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
    const { unnest: unnestFields } = source;
    // oxlint-disable unicorn/no-null
    const channels =
      unnestFields.length === 0
        ? this.channels
        : this.channels.map((c) => {
            /*This whole thing would be simpler if fields were stored separately*/

            //@ts-expect-error Every error is about `field` being optional
            const name = isColumnRef(c.field)
              ? //@ts-expect-error
                c.field.column
              : //@ts-expect-error
                typeof c.field === 'string'
                ? //@ts-expect-error
                  c.field
                : null;
            // oxlint-disable-next-line no-eq-null
            return name != null && unnestFields.includes(name)
              ? //@ts-expect-error
                { ...c, field: unnest(c.field) }
              : c;
          });

    // oxlint-enable unicorn/no-null

    //@ts-expect-error
    return markQuery(channels, this.sourceTable()).where(filter);
  }

  channelField(_channel: string): any {
    throw new Error(
      `TODO @dangotbanned: replace ${this.channelField.name} with using a less ad-hoc data structure`,
    );
  }
}
