export function specToAST(spec) {
  const ast = {
    meta: {},
    data: {},
    params: {},
    root: {}
  };

  parseMeta(spec.meta, ast);
  parseData(spec.data, ast);
  parseParams(spec.params, ast);
  parseTree(spec, ast);

  return ast;
}

function parseMeta(meta = {}, ast) {
  ast.meta = { ...meta };
}

function parseData(data, ast) {
  // switch on data types
}

function parseParams(params, ast) {
  // switch on param types
}

function parseTree(node, ast) {
  // switch on node types
  // add to data, params as needed
}
