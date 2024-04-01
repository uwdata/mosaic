import { Param, Selection } from '@uwdata/mosaic-core';
import { SpecNode } from './ast/SpecNode.js';

/**
 * Generate running web application (DOM content) for a Mosaic spec AST.
 * @param ast Mosaic AST root node.
 * @param options Instantiation options.
 * @returns An object with the resulting DOM element, and a map of named parameters (Param and Selection instances).
 */
export function astToDOM(
  ast: SpecNode,
  options?: AstToDOMOptions
) : Promise<AstToDOMResult>;

/**
 * Mosaic specification instantiation options.
 */
export interface AstToDOMOptions {
  api?: object;
  plotDefaults?: any[];
  params?: Map<string, Param | Selection>;
  /** The base URL for loading data files. */
  baseURL?: string;
}

export type AstToDOMResult = {
  element: HTMLElement | SVGSVGElement,
  params: Map<string, Param | Selection>
};
