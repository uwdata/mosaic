import {
  attributeDirectives,
  interactorDirectives,
  legendDirectives,
  markDirectives
} from '@uwdata/vgplot';

/**
 * Generate an object of lookup maps for vgplot components.
 */
export function plotNames({
  attributes = plotAttributeNames(),
  interactors = plotInteractorNames(),
  legends = plotLegendNames(),
  marks = plotMarkNames()
} = {}) {
  return { attributes, interactors, legends, marks };
}

/**
 * Names of attribute directive functions.
 * @returns {Set<string>}
 */
export function plotAttributeNames(overrides = []) {
  return new Set([
    ...Object.keys(attributeDirectives),
    ...overrides
  ]);
}

/**
 * Names interactor directive functions.
 * @returns {Set<string>}
 */
export function plotInteractorNames(overrides = []) {
  return new Set([
    ...Object.keys(interactorDirectives),
    ...overrides
  ]);
}

/**
 * Names of legend directive functions.
 * @returns {Set<string>}
 */
export function plotLegendNames(overrides = []) {
  return new Set([
    ...Object.keys(legendDirectives),
    ...overrides
  ]);
}

/**
 * Names of mark directive functions.
 * @returns {Set<string>}
 */
export function plotMarkNames(overrides = []) {
  return new Set([
    ...Object.keys(markDirectives),
    ...overrides
  ]);
}
