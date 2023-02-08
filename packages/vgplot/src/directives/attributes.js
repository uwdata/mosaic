import { isParam } from '@uwdata/mosaic-core';
import { namedPlots } from './named-plots.js';

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

export function width(value) {
  return attribute('width', value);
}

export function height(value) {
  return attribute('height', value);
}

export function margin(value) {
  return attribute('margin', value);
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

export function marginTop(value) {
  return attribute('marginTop', value);
}

export function marginBottom(value) {
  return attribute('marginBottom', value);
}
export function marginLeft(value) {
  return attribute('marginLeft', value);
}

export function marginRight(value) {
  return attribute('marginRight', value);
}

export function axisX(value) {
  return attribute('axisX', value);
}

export function axisY(value) {
  return attribute('axisY', value);
}

export function axisLineX(value) {
  return attribute('axisLineX', value);
}

export function axisLineY(value) {
  return attribute('axisLineY', value);
}

export function insetX(value) {
  return attribute('insetX', value);
}

export function insetY(value) {
  return attribute('insetY', value);
}

export function grid(value) {
  return attribute('grid', value);
}

export function gridX(value) {
  return attribute('gridX', value);
}

export function gridY(value) {
  return attribute('gridY', value);
}

export function scaleX(value) {
  return attribute('scaleX', value);
}

export function scaleY(value) {
  return attribute('scaleY', value);
}

export function domainX(value) {
  return attribute('domainX', value);
}

export function domainY(value) {
  return attribute('domainY', value);
}

export function domainXY(value) {
  return attributes({ domainX: value, domainY: value });
}

export function domainFX(value) {
  return attribute('domainFX', value);
}

export function domainFY(value) {
  return attribute('domainFY', value);
}

export function niceX(value) {
  return attribute('niceX', value);
}

export function niceY(value) {
  return attribute('niceY', value);
}

export function zeroX(value) {
  return attribute('zeroX', value);
}

export function zeroY(value) {
  return attribute('zeroY', value);
}

export function reverseX(value) {
  return attribute('reverseX', value);
}

export function reverseY(value) {
  return attribute('reverseY', value);
}

export function ticksX(value) {
  return attribute('ticksX', value);
}

export function ticksY(value) {
  return attribute('ticksY', value);
}

export function tickFormatX(value) {
  return attribute('tickFormatX', value);
}

export function tickFormatY(value) {
  return attribute('tickFormatY', value);
}

export function tickFormatColor(value) {
  return attribute('tickFormatColor', value);
}

export function tickRotateX(value) {
  return attribute('tickRotateX', value);
}

export function tickRotateY(value) {
  return attribute('tickRotateY', value);
}

export function tickSizeX(value) {
  return attribute('tickSizeX', value);
}

export function tickSizeY(value) {
  return attribute('tickSizeY', value);
}

export function labelX(value) {
  return attribute('labelX', value);
}

export function labelY(value) {
  return attribute('labelY', value);
}

export function labelAnchorX(value) {
  return attribute('labelAnchorX', value);
}

export function labelAnchorY(value) {
  return attribute('labelAnchorY', value);
}

export function labelOffsetX(value) {
  return attribute('labelOffsetX', value);
}

export function labelOffsetY(value) {
  return attribute('labelOffsetY', value);
}

export function scaleColor(value) {
  return attribute('scaleColor', value);
}

export function domainColor(value) {
  return attribute('domainColor', value);
}

export function rangeColor(value) {
  return attribute('rangeColor', value);
}

export function schemeColor(value) {
  return attribute('schemeColor', value);
}

export function interpolateColor(value) {
  return attribute('interpolateColor', value);
}

export function domainR(value) {
  return attribute('domainR', value);
}

export function rangeR(value) {
  return attribute('rangeR', value);
}

export function labelFX(value) {
  return attribute('labelFX', value);
}

export function labelFY(value) {
  return attribute('labelFX', value);
}

export function reverseFX(value) {
  return attribute('reverseFX', value);
}

export function reverseFY(value) {
  return attribute('reverseFY', value);
}

export function marginTopFacet(value) {
  return attribute('marginTopFacet', value);
}

export function marginRightFacet(value) {
  return attribute('marginRightFacet', value);
}

export function marginBottomFacet(value) {
  return attribute('marginBottomFacet', value);
}

export function marginLeftFacet(value) {
  return attribute('marginLeftFacet', value);
}

export function gridFacet(value) {
  return attribute('gridFacet', value);
}

export function labelFacet(value) {
  return attribute('labelFacet', value);
}
