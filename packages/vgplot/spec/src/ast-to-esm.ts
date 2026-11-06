import type { PlotAttributeNode } from './ast/PlotAttributeNode.js';
import type { SpecNode } from './ast/SpecNode.js';
import { resolveExtensions } from './config/extensions.js';
import { error, isArray, isObject, isString, toArray, toParamRef } from './util.js';

interface CodegenOptions {
  baseURL?: string;
  connector?: string;
  namespace?: string;
  depth?: number;
  imports?: Map<string, string | string[]>;
  preamble?: string | string[];
}

type CodegenConstructorOptions = Omit<CodegenOptions, 'preamble'> & { plotDefaults?: PlotAttributeNode[]};


/**
 * Generate ESM code for a Mosaic spec AST.
 * @param ast Mosaic AST root node.
 * @param [options] Code generation options.
 * @param [options.baseURL] The base URL for loading data files.
 * @param [options.connector] A database connector to initialize.
 *  Valid values are 'wasm' and 'rest'.
 *  If undefined, no connector code is generated.
 * @param [options.namespace='vg'] The vgplot API namespace object.
 * @param [options.depth=0] The starting indentation depth.
 * @param [options.imports] A Map of ESM
 *  imports to include in generated code. Keys are packages (e.g.,
 *  '@uwdata/vgplot') and values indicate what to import (e.g., '* as vg').
 * @param [options.preamble] Code to include after imports.
 * @returns Generated ESM code using the vgplot API.
 */
export function astToESM(ast: SpecNode, options: CodegenOptions = {}): string {
  const { root, data, params, plotDefaults } = ast;
  const { preamble, ...ctxOptions } = options;
  const ctx = new CodegenContext({ plotDefaults, ...ctxOptions });

  // generate package imports
  const importsCode: string[] = [];
  for (const [pkg, methods] of ctx.imports) {
    importsCode.push(
      isString(methods)
        ? `import ${methods} from "${pkg}";`
        : `import { ${methods.join(', ')} } from "${pkg}";`
    );
  }

  // preamble code comes directly after imports
  const preambleCode = preamble
    ? toArray(preamble).map(s => `${ctx.tab()}${s}`)
    : [];

  // generate database connector code
  const connectorCode: string[] = [];
  if (ctx.connector) {
    const con = `${ctx.ns()}${ctx.connector}Connector()`;
    connectorCode.push(
      `${ctx.tab()}${ctx.ns()}coordinator().databaseConnector(${con});`
    );
  }

  // process extensions and data definitions
  const queries: string[] = [];
  for (const name of resolveExtensions(ast)) {
    queries.push(`${ctx.ns()}loadExtension("${name}")`);
  }
  for (const node of Object.values(data)) {
    const load = node.codegen(ctx);
    if (load) queries.push(load);
  }

  // perform extension and data loading
  const dataCode: string[] = [];
  if (queries.length) {
    dataCode.push(`${ctx.tab()}await ${ctx.ns()}coordinator().exec([`);
    ctx.indent();
    dataCode.push(queries.map(q => `${ctx.tab()}${q}`).join(',\n'));
    ctx.undent();
    dataCode.push(`${ctx.tab()}]);`);
  }

  // generate params / selections
  const paramCode: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    paramCode.push(`const ${toParamRef(key)} = ${value.codegen(ctx)};`);
  }

  // generate default attributes
  let defaultCode: string[] = [];
  const defaultList = plotDefaults;
  if (defaultList.length) {
    defaultCode = [
      'const defaultAttributes = [',
      defaultList.map(a => '  ' + a.codegen(ctx)).join(',\n'),
      '];'
    ];
  }

  // generate specification tree
  const specCode: string[] = [
    `export default ${root.codegen(ctx)};`
  ];

  return [
    ...importsCode,
    ...maybeNewline(importsCode),
    ...preambleCode,
    ...maybeNewline(preambleCode),
    ...connectorCode,
    ...maybeNewline(connectorCode),
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
  readonly plotDefaults: PlotAttributeNode[]
  readonly namespace: string
  readonly connector?: string
  readonly imports: Map<string, string | string[]>
  readonly baseURL?: string
  private depth: number

  /**
   * Create a new code generator context.
   * @param [options] Code generation options.
   * @param [options.plotDefaults] Default attributes to apply to all plots.
   * @param [options.baseURL] The base URL for loading data files.
   * @param [options.connector] A database connector to initialize.
   *  Valid values are 'wasm' and 'rest'.
   *  If undefined, no connector code is generated.
   * @param [options.namespace='vg'] The vgplot API namespace object.
   * @param [options.depth=0] The starting indentation depth.
   * @param [options.imports] A Map of ESM
   *  imports to include in generated code. Keys are packages (e.g.,
   *  '@uwdata/vgplot') and values indicate what to import (e.g., '* as vg').
   */
  constructor({
    plotDefaults = [],
    namespace = 'vg',
    connector = undefined,
    imports = new Map([['@uwdata/vgplot', '* as vg']]),
    baseURL = undefined,
    depth = 0
  }: CodegenConstructorOptions = {}) {
    this.plotDefaults = plotDefaults;
    this.namespace = `${namespace}.`;
    this.connector = connector;
    this.imports = imports;
    this.baseURL = baseURL;
    this.depth = depth;
  }

  addImport(pkg: string, method: string): void {
    if (!this.imports.has(pkg)) {
      this.imports.set(pkg, [method]);
    } else {
      //@ts-expect-error Property 'push' does not exist on type 'string | string[]'.
      this.imports.get(pkg).push(method);
    }
  }

  setImports(pkg: string, all: string | string[]): void {
    this.imports.set(pkg, all);
  }

  ns(): string {
    return this.namespace;
  }

  indent(): void {
    this.depth += 1;
  }

  undent(): void {
    this.depth -= 1;
  }

  tab() {
    return Array.from({ length: this.depth }, () => '  ').join('');
  }

  stringify(value: unknown): string {
    if (isArray(value)) {
      const items = value.map(v => this.stringify(v));
      return `[${this.maybeLineWrap(items)}]`;
    } else if (isObject(value)) {
      const props = Object.entries(value)
        .map(([k, v]) => `${maybeQuote(k)}: ${this.stringify(v)}`);
      return `{${this.maybeLineWrap(props)}}`;
    } else {
      return JSON.stringify(value);
    }
  }

  maybeLineWrap(spans: any[]): string {
    const limit = 80 - 2 * this.depth;
    const chars = 2 * spans.length + spans.reduce((a: any, b: string | any[]) => a + b.length, 0);
    if (chars > limit) {
      this.indent();
      const str = spans.map((s: any) => `\n${this.tab()}${s}`).join(',')
      this.undent();
      return str + '\n' + this.tab();
    } else {
      return spans.join(', ');
    }
  }

  error(message: string, data: unknown): never {
    error(message, data);
  }
}

function maybeQuote(str: string): string {
  return /^[A-Za-z_$]\w*/.test(str) ? str : JSON.stringify(str);
}

function maybeNewline(entry: string | any[]): string[] {
  return entry?.length ? [''] : [];
}
