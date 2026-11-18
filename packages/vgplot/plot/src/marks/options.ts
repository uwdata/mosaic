import type * as msql from '@uwdata/mosaic-sql';

import type { bin } from '../transforms/bin.js';
import type { ChannelName, ScaleName, CanParam } from '../types.js';

export type BinReturn = ReturnType<typeof bin>;

type BottomTop = 'bottom' | 'top';
type LeftRight = 'left' | 'right';
type Anchor = BottomTop | LeftRight | `${BottomTop}-${LeftRight}`;
type FacetAnchor = Anchor | 'empty' | `${BottomTop | LeftRight}-empty`;
export type FrameAnchor = Anchor | 'middle';

type TipPointer = 'x' | 'y' | 'xy';

type Order = 'ascending' | 'descending';
type ChannelDomainName = ChannelName | 'data' | 'width' | 'height';
type OrReverse<T extends string> = T | `-${T}`;
type ChannelDomainValue = OrReverse<ChannelDomainName> | null;

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

type ColumnValues = any[];
type ChannelConstant = number | boolean | null;

export type ChannelValue =
  | FieldOrLiteralColor
  | ChannelConstant
  | ColumnValues
  | BinReturn
  | msql.ExprNode;

interface HasValue<T> {
  value: T;
}

interface HasLabel {
  label: string;
}

interface HasScale {
  scale: ScaleName | 'auto' | boolean | null;
}

interface HasOrder<O = Order> {
  order: O;
}
interface ChannelValueLabel extends HasValue<ChannelValue>, HasLabel, Partial<HasScale> {}
interface ChannelValueScale extends HasValue<ChannelValue>, HasScale, Partial<HasLabel> {}

export type ChannelValueSpec = ChannelValue | ChannelValueLabel | ChannelValueScale;

/** Options for imputing scale domains from channel values. */
interface ChannelDomainOptions extends Partial<HasOrder<Order | null>> {
  reduce?: Reducer | boolean | null;
  reverse?: boolean;
  limit?: number | [lo?: number, hi?: number];
}

interface ChannelDomainValueSpec extends HasValue<ChannelDomainValue>, ChannelDomainOptions {}

// oxlint-disable typescript/consistent-indexed-object-style
/** How to impute scale domains from channel values. */
type ChannelDomainSort = {
  [name in ScaleName]?: ChannelDomainValue | ChannelDomainValueSpec;
} & ChannelDomainOptions;

type FormatOptions = { [name in ChannelName]?: CanParam<boolean | string> };

// oxlint-enable typescript/consistent-indexed-object-style

interface OrderValue extends HasOrder, HasValue<ChannelValue> {}

interface OrderChannel extends Partial<HasOrder> {
  channel: OrReverse<ChannelName>;
}

/** Shared options for all marks and tip. */
interface BaseOptions {
  filter?: ChannelValue;
  select?: SelectFilter;
  reverse?: CanParam<boolean>;
  sort?: ChannelDomainSort | ChannelValue | OrderValue | OrderChannel;
  fx?: ChannelValue;
  fy?: ChannelValue;
  facet?: CanParam<'auto' | 'include' | 'exclude' | 'super' | boolean | null>;
  facetAnchor?: CanParam<FacetAnchor | null>;
  margin?: CanParam<number>;
  marginTop?: CanParam<number>;
  marginRight?: CanParam<number>;
  marginBottom?: CanParam<number>;
  marginLeft?: CanParam<number>;
  ariaDescription?: CanParam<string>;
  ariaHidden?: CanParam<string>;
  ariaLabel?: ChannelValue;
  pointerEvents?: CanParam<string>;
  title?: ChannelValue;
  /**
   * Additional named channels, for example to include in a tooltip. Consists of (channel name, data
   * field name) key-value pairs.
   */
  channels?: Record<string, string>;
  clip?: CanParam<'frame' | 'sphere' | boolean | null>;
  dx?: CanParam<number>;
  dy?: CanParam<number>;
  fill?: CanParam<ChannelValueSpec>; // TODO @dangotbanned: Review object `Param`
  fillOpacity?: CanParam<ChannelValueSpec>; // TODO @dangotbanned: Review object `Param`
  stroke?: CanParam<ChannelValueSpec>; // TODO @dangotbanned: Review object `Param`
  strokeDasharray?: CanParam<string | number>;
  strokeDashoffset?: CanParam<string | number>;
  strokeLinecap?: CanParam<string>;
  strokeLinejoin?: CanParam<string>;
  strokeMiterlimit?: CanParam<number>;
  strokeOpacity?: ChannelValueSpec;
  strokeWidth?: ChannelValueSpec;
  opacity?: ChannelValueSpec;
  mixBlendMode?: CanParam<string>;
  imageFilter?: CanParam<string>;
  paintOrder?: CanParam<string>;
  shapeRendering?: CanParam<string>;
  href?: ChannelValue;
  target?: CanParam<string>;
}

/**
 * Shared options for all marks.
 *
 * ## Note
 *
 * Comments like below are worth investigating for an upper bound to ` CanParam<T>`.\
 * E.g. defining it as a conditional type that keeps complex objects outside of `Param<...>`
 *
 * > _TODO dangotbanned: Review object `Param`_
 */
export interface MarkOptions extends BaseOptions {
  tip?: CanParam<boolean | TipPointer> | TipOptions;
}

export interface TextStyles {
  textAnchor?: CanParam<'start' | 'middle' | 'end'>;
  lineHeight?: CanParam<number>;
  lineWidth?: CanParam<number>;
  textOverflow?: CanParam<
    | null
    | 'clip'
    | 'ellipsis'
    | 'clip-start'
    | 'clip-end'
    | 'ellipsis-start'
    | 'ellipsis-middle'
    | 'ellipsis-end'
  >;

  monospace?: CanParam<boolean>;
  fontFamily?: CanParam<string>;
  fontSize?: CanParam<ChannelValue>; // TODO @dangotbanned: Review object `Param`
  fontStyle?: CanParam<string>;
  fontVariant?: CanParam<string>;
  fontWeight?: CanParam<string | number>;
}

export interface TipOptions extends BaseOptions, TextStyles {
  x?: ChannelValueSpec;
  x1?: ChannelValueSpec;
  x2?: ChannelValueSpec;
  y?: ChannelValueSpec;
  y1?: ChannelValueSpec;
  y2?: ChannelValueSpec;
  frameAnchor?: CanParam<FrameAnchor>;
  anchor?: CanParam<FrameAnchor>;
  preferredAnchor?: CanParam<FrameAnchor | null>;
  format?: FormatOptions;
  pathFilter?: CanParam<string>;
  pointerSize?: CanParam<number>;
  textPadding?: CanParam<number>;
  pointer?: TipPointer;
}
