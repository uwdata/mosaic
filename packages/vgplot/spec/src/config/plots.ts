import {
  attributeDirectives,
  interactorDirectives,
  legendDirectives,
  markDirectives,
} from '@uwdata/vgplot';

import type { PlotAttributes } from '../spec/PlotAttribute.js';
import type { PlotInteractor } from '../spec/PlotInteractor.js';
import type { PlotLegend } from '../spec/PlotLegend.js';
import type { PlotMark } from '../spec/PlotMark.js';

type StringKeys<T extends PropertyKey> = T extends string ? T : never;

export type PlotInteractorName = PlotInteractor['select'];
export type PlotAttributeName = StringKeys<keyof PlotAttributes>;
export type PlotLegendName = `${PlotLegend['legend']}Legend`;
export type PlotMarkName = PlotMark['mark'];

/** Names of attribute directive functions. */
export function plotAttributeNames(): Set<PlotAttributeName>;
export function plotAttributeNames<T extends string>(overrides: T[]): Set<T | PlotAttributeName>;
export function plotAttributeNames<T extends string>(
  overrides: T[] = [],
): Set<T | PlotAttributeName> {
  return new Set([...(Object.keys(attributeDirectives) as PlotAttributeName[]), ...overrides]);
}

/** Names of interactor directive functions. */
export function plotInteractorNames(): Set<PlotInteractorName>;
export function plotInteractorNames<T extends string>(overrides: T[]): Set<T | PlotInteractorName>;
export function plotInteractorNames<T extends string>(
  overrides: T[] = [],
): Set<T | PlotInteractorName> {
  return new Set([...(Object.keys(interactorDirectives) as PlotInteractorName[]), ...overrides]);
}

/** Names of legend directive functions. */
export function plotLegendNames(): Set<PlotLegendName>;
export function plotLegendNames<T extends string>(overrides: T[]): Set<T | PlotLegendName>;
export function plotLegendNames<T extends string>(overrides: T[] = []): Set<T | PlotLegendName> {
  return new Set([...(Object.keys(legendDirectives) as PlotLegendName[]), ...overrides]);
}

/** Names of mark directive functions. */
export function plotMarkNames(): Set<PlotMarkName>;
export function plotMarkNames<T extends string>(overrides: T[]): Set<T | PlotMarkName>;
export function plotMarkNames<T extends string>(overrides: T[] = []): Set<T | PlotMarkName> {
  return new Set([...(Object.keys(markDirectives) as PlotMarkName[]), ...overrides]);
}

export interface PlotNames {
  attributes: Set<PlotAttributeName>;
  interactors: Set<PlotInteractorName>;
  legends: Set<PlotLegendName>;
  marks: Set<PlotMarkName>;
}

/** Generate an object of lookup maps for vgplot components. */
export function plotNames({
  attributes = plotAttributeNames(),
  interactors = plotInteractorNames(),
  legends = plotLegendNames(),
  marks = plotMarkNames(),
}: Partial<PlotNames> = {}): PlotNames {
  return { attributes, interactors, legends, marks };
}
