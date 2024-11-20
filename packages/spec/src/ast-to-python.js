import { SpecNode } from "./ast/SpecNode.js";

/**
 * Generate Python code for a Mosaic spec AST.
 * @param {SpecNode} ast Mosaic AST root node.
 * @param {object} [options] Code generation options.
 * @returns {string} Generated Python code using the mosaic-spec classes.
 */
export function astToPython(ast, options = {}) {
  const { root, data, params, plotDefaults } = ast;

  // Convert the entire spec to JSON and format as Python
  const spec = ast.toJSON();
  const pythonDict = JSON.stringify(spec, null, 2)
    .replace(/true/g, "True")
    .replace(/false/g, "False")
    .replace(/null/g, "None");

  return `from mosaic_spec import *
from typing import Dict, Any, Union

spec = ${pythonDict}
`;
}

export class PythonCodegenContext {
  constructor(options = {}) {
    this.depth = 0;
    this.options = options;
  }

  indent() {
    this.depth += 1;
  }

  undent() {
    this.depth -= 1;
  }

  tab() {
    return "    ".repeat(this.depth);
  }
}
