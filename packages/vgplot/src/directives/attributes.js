import { isParam } from '@uwdata/mosaic-core';
import { namedPlots } from './plot.js';

export function name(name) {
  return plot => namedPlots.set(name, plot);
}

function setAttribute(plot, name, value) {
  if (isParam(value)) {
    value.addEventListener('value', value => {
      plot.setAttribute(name, value);
      plot.update();
    });
    if (value.value !== undefined) {
      plot.setAttribute(name, value.value);
    }
  } else {
    plot.setAttribute(name, value);
  }
}

export function attribute(name, value) {
  return plot => { setAttribute(plot, name, value); };
}

export function attributes(values) {
  return plot => {
    for (const [name, value] of Object.entries(values)) {
      setAttribute(plot, name, value)
    }
  };
}

export function margins(object) {
  const { top, bottom, left, right } = object;
  const attr = {};
  if (top !== undefined) attr.marginTop = top;
  if (bottom !== undefined) attr.marginBottom = bottom;
  if (left !== undefined) attr.marginLeft = left;
  if (right !== undefined) attr.marginRight = right;
  return attributes(attr);
}

export function xyDomain(value) {
  return attributes({ xDomain: value, yDomain: value });
}

const attrf = name => value => attribute(name, value);

// plot-level attributes
export const style = attrf('style');
export const width = attrf('width');
export const height = attrf('height');
export const margin = attrf('margin');
export const marginLeft = attrf('marginLeft');
export const marginRight = attrf('marginRight');
export const marginTop = attrf('marginTop');
export const marginBottom = attrf('marginBottom');
export const align = attrf('align');
export const aspectRatio = attrf('aspectRatio');
export const axis = attrf('axis');
export const inset = attrf('inset');
export const grid = attrf('grid');
export const label = attrf('label');
export const padding = attrf('padding');
export const round = attrf('round');

// x scale attributes
export const xScale = attrf('xScale');
export const xDomain = attrf('xDomain');
export const xRange = attrf('xRange');
export const xNice = attrf('xNice');
export const xInset = attrf('xInset');
export const xInsetLeft = attrf('xInsetLeft');
export const xInsetRight = attrf('xInsetRight');
export const xClamp = attrf('xClamp');
export const xRound = attrf('xRound');
export const xAlign = attrf('xAlign');
export const xPadding = attrf('xPadding');
export const xPaddingInner = attrf('xPaddingInner');
export const xPaddingOuter = attrf('xPaddingOuter');
export const xAxis = attrf('xAxis');
export const xTicks = attrf('xTicks');
export const xTickSize = attrf('xTickSize');
export const xTickSpacing = attrf('xTickSpacing');
export const xTickPadding = attrf('xTickPadding');
export const xTickFormat = attrf('xTickFormat');
export const xTickRotate = attrf('xTickRotate');
export const xGrid = attrf('xGrid');
export const xLine = attrf('xLine');
export const xLabel = attrf('xLabel');
export const xLabelAnchor = attrf('xLabelAnchor');
export const xLabelOffset = attrf('xLabelOffset');
export const xFontVariant = attrf('xFontVariant');
export const xAriaLabel = attrf('xAriaLabel');
export const xAriaDescription = attrf('xAriaDescription');
export const xReverse = attrf('xReverse');
export const xZero = attrf('xZero');

// y scale attributes
export const yScale = attrf('yScale');
export const yDomain = attrf('yDomain');
export const yRange = attrf('yRange');
export const yNice = attrf('yNice');
export const yInset = attrf('yInset');
export const yInsetTop = attrf('yInsetTop');
export const yInsetBottom = attrf('yInsetBottom');
export const yClamp = attrf('yClamp');
export const yRound = attrf('yRound');
export const yAlign = attrf('yAlign');
export const yPadding = attrf('yPadding');
export const yPaddingInner = attrf('yPaddingInner');
export const yPaddingOuter = attrf('yPaddingOuter');
export const yAxis = attrf('yAxis');
export const yTicks = attrf('yTicks');
export const yTickSize = attrf('yTickSize');
export const yTickSpacing = attrf('yTickSpacing');
export const yTickPadding = attrf('yTickPadding');
export const yTickFormat = attrf('yTickFormat');
export const yTickRotate = attrf('yTickRotate');
export const yGrid = attrf('yGrid');
export const yLine = attrf('yLine');
export const yLabel = attrf('yLabel');
export const yLabelAnchor = attrf('yLabelAnchor');
export const yLabelOffset = attrf('yLabelOffset');
export const yFontVariant = attrf('yFontVariant');
export const yAriaLabel = attrf('yAriaLabel');
export const yAriaDescription = attrf('yAriaDescription');
export const yReverse = attrf('yReverse');
export const yZero = attrf('yZero');

// facet attributes
export const facetMargin = attrf('facetMargin');
export const facetMarginTop = attrf('facetMarginTop');
export const facetMarginBottom = attrf('facetMarginBottom');
export const facetMarginLeft = attrf('facetMarginLeft');
export const facetMarginRight = attrf('facetMarginRight');
export const facetGrid = attrf('facetGrid');
export const facetLabel = attrf('facetLabel');

// fx scale attributes
export const fxDomain = attrf('fxDomain');
export const fxRange = attrf('fxRange');
export const fxNice = attrf('fxNice');
export const fxInset = attrf('fxInset');
export const fxInsetLeft = attrf('fxInsetLeft');
export const fxInsetRight = attrf('fxInsetRight');
export const fxRound = attrf('fxRound');
export const fxAlign = attrf('fxAlign');
export const fxPadding = attrf('fxPadding');
export const fxPaddingInner = attrf('fxPaddingInner');
export const fxPaddingOuter = attrf('fxPaddingOuter');
export const fxAxis = attrf('fxAxis');
export const fxTicks = attrf('fxTicks');
export const fxTickSize = attrf('fxTickSize');
export const fxTickSpacing = attrf('fxTickSpacing');
export const fxTickPadding = attrf('fxTickPadding');
export const fxTickFormat = attrf('fxTickFormat');
export const fxTickRotate = attrf('fxTickRotate');
export const fxGrid = attrf('fxGrid');
export const fxLine = attrf('fxLine');
export const fxLabel = attrf('fxLabel');
export const fxLabelAnchor = attrf('fxLabelAnchor');
export const fxLabelOffset = attrf('fxLabelOffset');
export const fxFontVariant = attrf('fxFontVariant');
export const fxAriaLabel = attrf('fxAriaLabel');
export const fxAriaDescription = attrf('fxAriaDescription');
export const fxReverse = attrf('fxReverse');

// fy scale attributes
export const fyDomain = attrf('fyDomain');
export const fyRange = attrf('fyRange');
export const fyNice = attrf('fyNice');
export const fyInset = attrf('fyInset');
export const fyInsetTop = attrf('fyInsetTop');
export const fyInsetBottom = attrf('fyInsetBottom');
export const fyRound = attrf('fyRound');
export const fyAlign = attrf('fyAlign');
export const fyPadding = attrf('fyPadding');
export const fyPaddingInner = attrf('fyPaddingInner');
export const fyPaddingOuter = attrf('fyPaddingOuter');
export const fyAxis = attrf('fyAxis');
export const fyTicks = attrf('fyTicks');
export const fyTickSize = attrf('fyTickSize');
export const fyTickSpacing = attrf('fyTickSpacing');
export const fyTickPadding = attrf('fyTickPadding');
export const fyTickFormat = attrf('fyTickFormat');
export const fyTickRotate = attrf('fyTickRotate');
export const fyGrid = attrf('fyGrid');
export const fyLine = attrf('fyLine');
export const fyLabel = attrf('fyLabel');
export const fyLabelAnchor = attrf('fyLabelAnchor');
export const fyLabelOffset = attrf('fyLabelOffset');
export const fyFontVariant = attrf('fyFontVariant');
export const fyAriaLabel = attrf('fyAriaLabel');
export const fyAriaDescription = attrf('fyAriaDescription');
export const fyReverse = attrf('fyReverse');

// color scale attributes
export const colorScale = attrf('colorScale');
export const colorDomain = attrf('colorDomain');
export const colorRange = attrf('colorRange');
export const colorClamp = attrf('colorClamp');
export const colorNice = attrf('colorNice');
export const colorScheme = attrf('colorScheme');
export const colorInterpolate = attrf('colorInterpolate');
export const colorPivot = attrf('colorPivot');
export const colorSymmetric = attrf('colorSymmetric');
export const colorLabel = attrf('colorLabel');
export const colorReverse = attrf('colorReverse');
export const colorZero = attrf('colorZero');
export const colorTickFormat = attrf('colorTickFormat');

// opacity scale attributes
export const opacityScale = attrf('opacityScale');
export const opacityDomain = attrf('opacityDomain');
export const opacityRange = attrf('opacityRange');
export const opacityClamp = attrf('opacityClamp');
export const opacityNice = attrf('opacityNice');
export const opacityLabel = attrf('opacityLabel');
export const opacityReverse = attrf('opacityReverse');
export const opacityZero = attrf('opacityZero');
export const opacityTickFormat = attrf('opacityTickFormat');

// r scale attributes
export const rScale = attrf('rScale');
export const rDomain = attrf('rDomain');
export const rRange = attrf('rRange');
export const rClamp = attrf('rClamp');
export const rNice = attrf('rNice');
export const rZero = attrf('rZero');

// length scale attributes
export const lengthScale = attrf('lengthScale');
export const lengthDomain = attrf('lengthDomain');
export const lengthRange = attrf('lengthRange');
export const lengthClamp = attrf('lengthClamp');
export const lengthNice = attrf('lengthNice');
export const lengthZero = attrf('lengthZero');

// projection attributes
export const projectionType = attrf('projectionType');
export const projectionParallels = attrf('projectionParallels');
export const projectionPrecision = attrf('projectionPrecision');
export const projectionRotate = attrf('projectionRotate');
export const projectionDomain = attrf('projectionDomain');
export const projectionInset = attrf('projectionInset');
export const projectionInsetLeft = attrf('projectionInsetLeft');
export const projectionInsetRight = attrf('projectionInsetRight');
export const projectionInsetTop = attrf('projectionInsetTop');
export const projectionInsetBottom = attrf('projectionInsetBottom');
export const projectionClip = attrf('projectionClip');
