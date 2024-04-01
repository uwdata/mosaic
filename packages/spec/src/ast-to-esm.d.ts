import { SpecNode } from './ast/SpecNode.js';

/**
 * Generate ESM (ECMAScript Module) code for a Mosaic specification AST.
 * @param ast Mosaic AST root node.
 * @param options Code generation options.
 * @returns Generated ESM code using the vgplot API.
 */
export function astToESM(
  ast: SpecNode,
  options?: AstToESMOptions
) : string;

/**
 * Mosaic specification code generation options.
 */
export interface AstToESMOptions {
  /** The base URL for loading data files. */
  baseURL?: string;
  /**
   * A database connector to initialize.
   * Valid values are 'wasm', 'socket', and 'rest'.
   * If undefined, no connector code is generated.
   */
  connector?: 'wasm' | 'socket' | 'rest' | string;
  /** The vgplot API namespace object (default 'vg'). */
  namespace?: string;
  /** The starting indentation depth (default 0). */
  depth?: number;
  /**
   * A Map of imports to include in generated code. Keys are packages (e.g.,
   * '@uwdata/vgplot') and values indicate what to import (e.g., '* as vg').
   */
  imports?: Map<string, string>;
  /** Code to include after imports. */
  preamble?: string | string[];
}
