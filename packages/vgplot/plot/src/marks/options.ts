import type * as mc from '@uwdata/mosaic-core';
import type * as msql from '@uwdata/mosaic-sql';

import type { bin } from '../transforms/bin.js';
import type { ChannelName, ScaleName } from '../types.js';

type BinReturn = ReturnType<typeof bin>;

export type FrameAnchor =
  | 'middle'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

type TipPointer = 'x' | 'y' | 'xy';

type Order = 'ascending' | 'descending';

type SelectFilter =
  | 'first'
  | 'last'
  | 'maxX'
  | 'maxY'
  | 'minX'
  | 'minY'
  | 'nearest'
  | 'nearestX'
  | 'nearestY';

type ReducerPercentile = (`p${number}${number}` & Record<never, never>) | 'p25' | 'p50' | 'p75';

type Reducer =
  | 'first'
  | 'last'
  | 'identity'
  | 'count'
  | 'distinct'
  | 'sum'
  | 'proportion'
  | 'proportion-facet'
  | 'deviation'
  | 'min'
  | 'min-index'
  | 'max'
  | 'max-index'
  | 'mean'
  | 'median'
  | 'variance'
  | 'mode'
  | ReducerPercentile;

// https://github.com/microsoft/TypeScript/issues/29729
type FieldOrLiteralColor = string & Record<never, never>;

export type ChannelValue =
  | any[] // Column of values
  | FieldOrLiteralColor
  | number // Constant
  | boolean // Constant
  | null // Constant
  | BinReturn
  | msql.ExprNode;

export type ChannelValueSpec =
  | ChannelValue
  | {
      value: ChannelValue;
      label?: string; // Todo: either label or scale is required
      scale?: ScaleName | 'auto' | boolean | null;
    };

type ChannelDomainName = ChannelName | 'data' | 'width' | 'height';
type ChannelDomainValue = ChannelDomainName | `-${ChannelDomainName}` | null;

/** Options for imputing scale domains from channel values. */
interface ChannelDomainOptions {
  reduce?: Reducer | boolean | null;
  order?: Order | null;
  reverse?: boolean;
  limit?: number | [lo?: number, hi?: number];
}

/** How to derive a scale’s domain from a channel’s values. */
type ChannelDomainValueSpec =
  | ChannelDomainValue
  | ({ value: ChannelDomainValue } & ChannelDomainOptions);

/** How to impute scale domains from channel values. */
type ChannelDomainSort = Partial<Record<ScaleName, ChannelDomainValueSpec>> & ChannelDomainOptions;

type SortOrder =
  | ChannelValue
  | { value?: ChannelValue; order?: Order } // Todo: Make at-least `order` required
  | { channel?: ChannelName | `-${ChannelName}`; order?: Order };

/** Shared options for all marks. */
export interface MarkOptions {
  filter?: ChannelValue;
  select?: SelectFilter;
  reverse?: boolean | mc.Param<any>;
  sort?: SortOrder | ChannelDomainSort;
  fx?: ChannelValue;
  fy?: ChannelValue;
  facet?: 'auto' | 'include' | 'exclude' | 'super' | boolean | null | mc.Param<any>;
  facetAnchor?:
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-empty'
    | 'right-empty'
    | 'bottom-empty'
    | 'left-empty'
    | 'empty'
    | null
    | mc.Param<any>;

  margin?: number | mc.Param<any>;
  marginTop?: number | mc.Param<any>;
  marginRight?: number | mc.Param<any>;
  marginBottom?: number | mc.Param<any>;
  marginLeft?: number | mc.Param<any>;
  ariaDescription?: string | mc.Param<any>;
  ariaHidden?: string | mc.Param<any>;
  ariaLabel?: ChannelValue;
  pointerEvents?: string | mc.Param<any>;
  title?: ChannelValue;

  /** Whether to generate a tooltip for this mark, and any tip options. */
  tip?:
    | boolean
    | TipPointer
    | (TipOptions & /*Todo: move this intersection into `TipOptions` itself*/ {
        pointer?: TipPointer;
      })
    | mc.Param<any>;

  /**
   * Additional named channels, for example to include in a tooltip. Consists of (channel name, data
   * field name) key-value pairs.
   */
  channels?: Record<string, string>;
  clip?: 'frame' | 'sphere' | boolean | null | mc.Param<any>;
  dx?: number | mc.Param<any>;
  dy?: number | mc.Param<any>;
  fill?: ChannelValueSpec | mc.Param<any>;
  fillOpacity?: ChannelValueSpec | mc.Param<any>;
  stroke?: ChannelValueSpec | mc.Param<any>;
  strokeDasharray?: string | number | mc.Param<any>;
  strokeDashoffset?: string | number | mc.Param<any>;
  strokeLinecap?: string | mc.Param<any>;
  strokeLinejoin?: string | mc.Param<any>;
  strokeMiterlimit?: number | mc.Param<any>;
  strokeOpacity?: ChannelValueSpec;
  strokeWidth?: ChannelValueSpec;
  opacity?: ChannelValueSpec;
  mixBlendMode?: string | mc.Param<any>;
  imageFilter?: string | mc.Param<any>;
  paintOrder?: string | mc.Param<any>;
  shapeRendering?: string | mc.Param<any>;
  href?: ChannelValue;
  target?: string | mc.Param<any>;
}

export interface TextStyles {
  textAnchor?: 'start' | 'middle' | 'end' | mc.Param<any>;
  lineHeight?: number | mc.Param<any>;
  lineWidth?: number | mc.Param<any>;
  textOverflow?:
    | null
    | 'clip'
    | 'ellipsis'
    | 'clip-start'
    | 'clip-end'
    | 'ellipsis-start'
    | 'ellipsis-middle'
    | 'ellipsis-end'
    | mc.Param<any>;

  monospace?: boolean | mc.Param<any>;
  fontFamily?: string | mc.Param<any>;
  fontSize?: ChannelValue | mc.Param<any>;
  fontStyle?: string | mc.Param<any>;
  fontVariant?: string | mc.Param<any>;
  fontWeight?: string | number | mc.Param<any>;
}

export interface TipOptions extends MarkOptions, TextStyles {
  x?: ChannelValueSpec;
  x1?: ChannelValueSpec;
  x2?: ChannelValueSpec;
  y?: ChannelValueSpec;
  y1?: ChannelValueSpec;
  y2?: ChannelValueSpec;
  frameAnchor?: FrameAnchor | mc.Param<any>;
  anchor?: FrameAnchor | mc.Param<any>;
  preferredAnchor?: FrameAnchor | null | mc.Param<any>;
  format?: Partial<Record<ChannelName, boolean | string | mc.Param<any>>>;
  pathFilter?: string | mc.Param<any>;
  pointerSize?: number | mc.Param<any>;
  textPadding?: number | mc.Param<any>;
}
