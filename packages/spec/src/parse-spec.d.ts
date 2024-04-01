import { Spec, SpecNode } from './ast/SpecNode.js';

/**
 * Parse a Mosaic specification to an AST (abstract syntax tree).
 */
export function parseSpec(
  spec: Spec | string,
  options?: ParseSpecOptions
) : SpecNode;

export interface ParseSpecOptions {
  components?: Map<string, Function>,
  transforms?: string[],
  inputs?: string[],
  plot?: string[],
  params?: any[],
  datasets?: any[]
}
