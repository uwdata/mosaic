// oxlint-disable unicorn/no-nested-ternary
import { MosaicClient } from '@uwdata/mosaic-core';
import type * as mc from '@uwdata/mosaic-core';
import type * as msql from '@uwdata/mosaic-sql';
import { isColumnRef, unnest } from '@uwdata/mosaic-sql';

import { type From, source as fromSource, type TableSource } from '../data.js';
import type { Plot } from '../plot.js';
import type { MarkType } from '../types.js';
import { markQuery, type EncodingName } from './Mark.js';
import type { MarkOptions, OptionName } from './options.js';
import { OptionsImpl } from './parse.js';

export type Requirements<T extends MarkOptions> = Partial<Record<OptionName<T>, mc.Stat[]>>;

/**
 * The original code used `for...in`, which behaves [differently][1] to {@link Object.entries}.
 *
 * Hoping to replace this later if not required.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#iterating_over_own_properties_only
 */
function* iterItems<O extends MarkOptions>(
  options: O,
): Generator<[OptionName<O>, O[OptionName<O>]]> {
  // oxlint-disable-next-line guard-for-in
  for (const c in options) {
    yield [c, options[c]];
  }
}

// oxlint-disable-next-line no-unused-vars typescript/explicit-function-return-type
function process(channel: EncodingName | 'channels', entry: any) {
  return;
}

/** Experimenting with a more precise `Mark` data model. */
export class Mark2<O extends MarkOptions = MarkOptions> extends MosaicClient {
  /** Inline data is not going to be modeled (at least for now) */
  readonly source: TableSource<string | mc.Param<string>> | undefined;
  private params: Set<mc.Param<any>>;
  public channels: object[];
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
    const params = (this.params = new Set<mc.Param<any>>());
    if (source) {
      this.source = fromSource(source);
      if (typeof this.source.table !== 'string') {
        params.add(this.source.table);
      }
    }

    const it = iterItems(options);
    throw new Error(
      `TODO @dangotbanned: handle the 'process' part of the 'Mark' constructor ${it}`,
    );
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
}
