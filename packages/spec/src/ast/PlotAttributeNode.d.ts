import { SpecParamRef } from './ParamRefNode.js';

export interface SpecPlotAttributes {
  name?: string;
  margins?: {
    top?: number | SpecParamRef;
    bottom?: number | SpecParamRef;
    left?: number | SpecParamRef;
    right?: number | SpecParamRef;
  };
  margin?: number | SpecParamRef;
  xyDomain?: any;

  // plot-level attributes
  style?: any;
  width?: any;
  height?: any;
  marginLeft?: any;
  marginRight?: any;
  marginTop?: any;
  marginBottom?: any;
  align?: any;
  aspectRatio?: any;
  axis?: any;
  inset?: any;
  grid?: any;
  label?: any;
  padding?: any;
  round?: any;

  // x scale attributes
  xScale?: any;
  xDomain?: any;
  xRange?: any;
  xNice?: any;
  xInset?: any;
  xInsetLeft?: any;
  xInsetRight?: any;
  xClamp?: any;
  xRound?: any;
  xAlign?: any;
  xPadding?: any;
  xPaddingInner?: any;
  xPaddingOuter?: any;
  xAxis?: any;
  xTicks?: any;
  xTickSize?: any;
  xTickSpacing?: any;
  xTickPadding?: any;
  xTickFormat?: any;
  xTickRotate?: any;
  xGrid?: any;
  xLine?: any;
  xLabel?: any;
  xLabelAnchor?: any;
  xLabelOffset?: any;
  xFontVariant?: any;
  xAriaLabel?: any;
  xAriaDescription?: any;
  xReverse?: any;
  xZero?: any;
  xBase?: any;
  xExponent?: any;
  xConstant?: any;

  // y scale attributes
  yScale?: any;
  yDomain?: any;
  yRange?: any;
  yNice?: any;
  yInset?: any;
  yInsetTop?: any;
  yInsetBottom?: any;
  yClamp?: any;
  yRound?: any;
  yAlign?: any;
  yPadding?: any;
  yPaddingInner?: any;
  yPaddingOuter?: any;
  yAxis?: any;
  yTicks?: any;
  yTickSize?: any;
  yTickSpacing?: any;
  yTickPadding?: any;
  yTickFormat?: any;
  yTickRotate?: any;
  yGrid?: any;
  yLine?: any;
  yLabel?: any;
  yLabelAnchor?: any;
  yLabelOffset?: any;
  yFontVariant?: any;
  yAriaLabel?: any;
  yAriaDescription?: any;
  yReverse?: any;
  yZero?: any;
  yBase?: any;
  yExponent?: any;
  yConstant?: any;

  // facet attributes
  facetMargin?: any;
  facetMarginTop?: any;
  facetMarginBottom?: any;
  facetMarginLeft?: any;
  facetMarginRight?: any;
  facetGrid?: any;
  facetLabel?: any;

  // fx scale attributes
  fxDomain?: any;
  fxRange?: any;
  fxNice?: any;
  fxInset?: any;
  fxInsetLeft?: any;
  fxInsetRight?: any;
  fxRound?: any;
  fxAlign?: any;
  fxPadding?: any;
  fxPaddingInner?: any;
  fxPaddingOuter?: any;
  fxAxis?: any;
  fxTicks?: any;
  fxTickSize?: any;
  fxTickSpacing?: any;
  fxTickPadding?: any;
  fxTickFormat?: any;
  fxTickRotate?: any;
  fxGrid?: any;
  fxLine?: any;
  fxLabel?: any;
  fxLabelAnchor?: any;
  fxLabelOffset?: any;
  fxFontVariant?: any;
  fxAriaLabel?: any;
  fxAriaDescription?: any;
  fxReverse?: any;

  // fy scale attributes
  fyDomain?: any;
  fyRange?: any;
  fyNice?: any;
  fyInset?: any;
  fyInsetTop?: any;
  fyInsetBottom?: any;
  fyRound?: any;
  fyAlign?: any;
  fyPadding?: any;
  fyPaddingInner?: any;
  fyPaddingOuter?: any;
  fyAxis?: any;
  fyTicks?: any;
  fyTickSize?: any;
  fyTickSpacing?: any;
  fyTickPadding?: any;
  fyTickFormat?: any;
  fyTickRotate?: any;
  fyGrid?: any;
  fyLine?: any;
  fyLabel?: any;
  fyLabelAnchor?: any;
  fyLabelOffset?: any;
  fyFontVariant?: any;
  fyAriaLabel?: any;
  fyAriaDescription?: any;
  fyReverse?: any;

  // color scale attributes
  colorScale?: any;
  colorDomain?: any;
  colorRange?: any;
  colorClamp?: any;
  colorN?: any;
  colorNice?: any;
  colorScheme?: any;
  colorInterpolate?: any;
  colorPivot?: any;
  colorSymmetric?: any;
  colorLabel?: any;
  colorReverse?: any;
  colorZero?: any;
  colorTickFormat?: any;
  colorBase?: any;
  colorExponent?: any;
  colorConstant?: any;

  // opacity scale attributes
  opacityScale?: any;
  opacityDomain?: any;
  opacityRange?: any;
  opacityClamp?: any;
  opacityNice?: any;
  opacityLabel?: any;
  opacityReverse?: any;
  opacityZero?: any;
  opacityTickFormat?: any;
  opacityBase?: any;
  opacityExponent?: any;
  opacityConstant?: any;

  // symbol scale attributes
  symbolScale?: any;
  symbolDomain?: any;
  symbolRange?: any;

  // r scale attributes
  rScale?: any;
  rDomain?: any;
  rRange?: any;
  rClamp?: any;
  rNice?: any;
  rZero?: any;
  rBase?: any;
  rExponent?: any;
  rConstant?: any;

  // length scale attributes
  lengthScale?: any;
  lengthDomain?: any;
  lengthRange?: any;
  lengthClamp?: any;
  lengthNice?: any;
  lengthZero?: any;
  lengthBase?: any;
  lengthExponent?: any;
  lengthConstant?: any;

  // projection attributes
  projectionType?: any;
  projectionParallels?: any;
  projectionPrecision?: any;
  projectionRotate?: any;
  projectionDomain?: any;
  projectionInset?: any;
  projectionInsetLeft?: any;
  projectionInsetRight?: any;
  projectionInsetTop?: any;
  projectionInsetBottom?: any;
  projectionClip?: any;
};
