import { error, isString, toParamRef } from './util.js';

export function astToModule(ast, options) {
  const ctx = new CodegenContext(options);
  const { root, parseContext } = ast;
  const { datasets, plotDefaults, params } = parseContext;

  // generate data definitions
  const dataCode = [];
  for (const [name, node] of datasets) {
    const def = node.codegen(ctx);
    if (def) dataCode.push(def);
  }

  // generate default attributes
  let defaultCode = [];
  const defaultList = plotDefaults;
  if (defaultList.length) {
    defaultCode = [
      'const defaultAttributes = [',
      defaultList.map(a => '  ' + a.codegen(ctx)).join(',\n'),
      '];'
    ];
  }

  // generate specification tree
  const specCode = [
    `export default ${root.codegen(ctx)};`
  ];

  // generate params / selections
  const paramCode = [];
  for (const [key, value] of params) {
    paramCode.push(`const ${toParamRef(key)} = ${value.codegen(ctx)};`);
  }

  // generate package imports
  const importsCode = [];
  for (const [pkg, methods] of ctx.imports) {
    importsCode.push(
      isString(methods)
        ? `import ${methods} from "${pkg}";`
        : `import { ${methods.join(', ')} } from "${pkg}";`
    );
  }

  return [
    ...importsCode,
    ...maybeNewline(importsCode),
    ...dataCode,
    ...maybeNewline(dataCode),
    ...paramCode,
    ...maybeNewline(paramCode),
    ...defaultCode,
    ...maybeNewline(defaultCode),
    ...specCode
  ].join('\n');
}

export class CodegenContext {
  constructor({
    namespace = 'vg.',
    imports = new Map([['@uwdata/vgplot', '* as vg']]),
    depth = 0
  } = {}) {
    this.namespace = namespace;
    this.imports = imports;
    this.depth = depth;
  }

  addImport(pkg, method) {
    if (!this.imports.has(pkg)) {
      this.imports.set(pkg, []);
    }
    this.imports.get(pkg).push(method);
  }

  setImports(pkg, all) {
    this.imports.set(pkg, all);
  }

  ns() {
    return this.namespace;
  }

  indent() {
    this.depth += 1;
  }

  undent() {
    this.depth -= 1;
  }

  tab() {
    return Array.from({ length: this.depth }, () => '  ').join('');
  }

  error(message, data) {
    error(message, data);
  }
}

function maybeNewline(entry) {
  return entry?.length ? [''] : [];
}
