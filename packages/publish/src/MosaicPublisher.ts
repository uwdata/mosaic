import yaml from "yaml";
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from "path";
import { rollup } from "rollup";
import virtual from "@rollup/plugin-virtual";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";


// Mosaic modules
import {
  parseSpec, astToESM, astToDOM,
  SpecNode, DataNode, FileDataNode,
  ParquetDataNode, OptionsNode,
  CodegenContext,
  QueryDataNode,
} from '@uwdata/mosaic-spec';
import { MosaicClient, isActivatable } from '@uwdata/mosaic-core';

// Utility imports
import {
  preamble, htmlTemplate, templateCSS,
  publishConnector, PublishContext, mockCanvas,
  VGPLOT, FLECHETTE,
  LogLevel, Logger,
  clientsReady,
} from './util/index.js';
import { binary, map, tableFromArrays, tableToIPC, utf8 } from "@uwdata/flechette";

/**
 * Error class for know publishing errors.
 * @param message Error message.
 */
export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishError';
  }
}

/**
 * Class to facilitate publishing a Mosaic specification.
 * @param spec Contents of JSON Mosaic specification file.
 * @param outputPath Path to the desired output directory.
 * @param title Optional title for the HTML file.
 * @param optimize Level of optimization for published visualization.
 * @param logger Optional logger instance to use for logging.
 * 
 * The `publish` method is the main entry point for the class
 */
export class MosaicPublisher {
  private spec: string;
  private outputPath: string;
  private title: string;
  private optimize: 'minimal' | 'more' | 'most';
  private logger: Logger;

  // Internal references used throughout
  private ctx: PublishContext;
  private ast?: SpecNode;
  private data?: Record<string, DataNode>;

  constructor(
    spec: string,
    outputPath = 'out',
    title = 'Mosaic Visualization',
    optimize: 'minimal' | 'more' | 'most' = 'minimal',
    logger: Logger = new Logger(LogLevel.INFO)
  ) {
    this.spec = spec;
    this.outputPath = outputPath;
    this.title = title;
    this.optimize = optimize;
    this.logger = logger;

    // Create PublishContext
    const connector = publishConnector();
    this.ctx = new PublishContext(connector);
  }

  /**
   * Main entry point for publishing a Mosaic specification.
   */
  public async publish() {
    this.logger.info('Parsing and processing spec...');

    // Parse specification
    try {
      this.ast = parseSpec(yaml.parse(this.spec));
    } catch (err) {
      throw new PublishError(`Failed to parse specification: ${err}`);
    }
    if (!this.ast) return;
    this.data = this.ast.data;

    // Setup jsdom
    const dom = new JSDOM(
      `<!DOCTYPE html><body></body>`,
      { pretendToBeVisual: true }
    );
    globalThis.window = dom.window as any;
    globalThis.document = dom.window.document;
    globalThis.navigator ??= dom.window.navigator;
    globalThis.requestAnimationFrame = window.requestAnimationFrame;
    mockCanvas(globalThis.window);

    // Load the visualization in the DOM and gather interactors/inputs
    const { element } = await astToDOM(this.ast, { api: this.ctx.api });
    document.body.appendChild(element);
    await clientsReady(this.ctx);

    const { interactors, inputs } = this.processClients();
    const isInteractive = interactors.size + inputs.size !== 0;

    // If spec is valid create relevant output directory
    if (fs.existsSync(this.outputPath)) {
      this.logger.warn(`Clearing output directory: ${this.outputPath}`);
      fs.rmSync(this.outputPath, { recursive: true });
      fs.mkdirSync(this.outputPath, { recursive: true });
    } else {
      this.logger.info(`Creating output directory: ${this.outputPath}`);
      fs.mkdirSync(this.outputPath, { recursive: true });
    }

    if (isInteractive) {
      // Activate interactors and inputs
      await this.activateInteractorsAndInputs(interactors, inputs);

      // Modify AST and process data (extensions, data definitions, etc.)
      const og = FileDataNode.prototype.codegenQuery;
      FileDataNode.prototype.codegenQuery = function (ctx: CodegenContext) {
        const code = og.call(this, ctx);
        const { file } = this;
        return code?.replace(`"${file}"`, `window.location.origin + "/${file}"`);
      };
      const tables = this.ctx.coordinator.databaseConnector().tables();
      await this.updateDataNodes(tables);

      // Export relevant data from DuckDB to Parquet
      await this.exportDataFromDuckDB(tables);
    }

    await this.writeFiles(isInteractive, element);
  }

  private processClients() {
    const interactors = new Set<any>();
    const inputs = new Set<MosaicClient>();

    for (const client of this.ctx.coordinator.clients) {
      if (client instanceof MosaicClient && isActivatable(client)) {
        inputs.add(client);
      }
      if (client.plot) {
        for (const interactor of client.plot.interactors) {
          interactors.add(interactor);
        }
      }
    }
    return { interactors, inputs };
  }

  /**
   * Activate the Interactors and Inputs, waiting 
   * for queries to finish.
   */
  private async activateInteractorsAndInputs(interactors: Set<any>, inputs: Set<MosaicClient>) {
    this.ctx.coordinator.manager._logQueries = true;
    for (const interactor of interactors) {
      if (isActivatable(interactor)) interactor.activate();
      await this.waitForQueryToFinish();
    }

    for (const input of inputs) {
      if (isActivatable(input)) input.activate();
      await this.waitForQueryToFinish();
    }
  }

  private async waitForQueryToFinish() {
    while (this.ctx.coordinator.manager.pendingExec) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Process data definitions (DataNodes) and converts them to ParquetDataNode
   * objects based on specified tables.
   */
  private async updateDataNodes(tables: Record<string, Set<string> | null>) {
    // process data definitions
    for (const node of Object.values(this.data!)) {
      if (!(node.name in tables)) {
        delete this.ast!.data[node.name];
        continue;
      }
      const name = node.name;
      const file = `data/${name}.parquet`;
      this.ast!.data[name] = new ParquetDataNode(name, file, new OptionsNode({}));
    }

    // process tables from DuckDB
    const db_tables = await this.ctx.coordinator.query('SHOW ALL TABLES', { cache: false, type: 'json' });
    if (db_tables.some((table: any) => table.name.startsWith('preagg_'))) {
      this.ast!.data['schema'] = new SchemaCreateNode('schema', 'mosaic');
      for (const table of db_tables) {
        if (table.name.startsWith('preagg_')) {
          const name = `${table.schema}.${table.name}`;
          tables[name] = null;
          const file = `data/.mosaic/${table.name}.parquet`;
          this.ast!.data[name] = new ParquetDataNode(name, file, new OptionsNode({}));
        } else if (table.name in tables && tables[table.name] == new Set(table.column_names)) {
          tables[table.name] = null;
        }
      }
    }
  }

  /**
   * Write out the index.js, index.html, and create data/ directory as needed.
   */
  private async writeFiles(isInteractive: boolean, element?: HTMLElement | SVGElement) {
    const cache = this.ctx.coordinator.manager.cache().export();
    const cacheFile = '.cache.arrow';
    if (cache) {
      const cacheBytes = tableToIPC(tableFromArrays({ cache: [cache] }, {
        types: {
          cache: map(utf8(), binary())
        }
      }), {})!;
      fs.writeFileSync(path.join(this.outputPath, cacheFile), cacheBytes);
    }

    const code = astToESM(this.ast!, {
      connector: 'wasm',
      imports: new Map([[VGPLOT, '* as vg'], [FLECHETTE, '{ tableFromIPC }']]),
      preamble: preamble(this.optimize == 'most', cache ? cacheFile : undefined),
    });
    const html = htmlTemplate(isInteractive, this.title, element, templateCSS);

    fs.writeFileSync(path.join(this.outputPath, 'index.html'), html);
    if (isInteractive) {
      const bundle = await rollup({
        input: 'entry.js',
        plugins: [  // We ts-ignore these because they use cjs default exports
          // @ts-ignore
          virtual({ 'entry.js': code }),
          // @ts-ignore
          resolve({ browser: true }),
          // @ts-ignore
          commonjs({ defaultIsModuleExports: true }),
        ],
        output: {
          manualChunks: {
            vgplot: ['@uwdata/vgplot'],
            flechette: ['@uwdata/flechette'],
          },
          minifyInternalExports: true,
        },
        logLevel: 'silent',
        treeshake: true,
      });

      await bundle.write({
        dir: this.outputPath,
        format: 'esm',
        entryFileNames: 'index.js',
      });
    }
  }

  /**
   * Export relevant data from DuckDB to local Parquet
   */
  private async exportDataFromDuckDB(tables: Record<string, Set<string> | null>) {
    const table_copy_queries: string[] = [];
    const materialized_view_copy_queries: string[] = [];
    for (const node of Object.values(this.data!)) {
      if (!(node instanceof ParquetDataNode)) continue;
      const table = node.name;
      const file = node.file;
      const relevant_columns = tables[table];
      if (relevant_columns?.size === 0) {
        this.logger.warn(`Skipping export of table: ${table}`);
        this.logger.warn(`No columns are being used from this table.`);
        continue;
      }

      let query: string;
      switch (this.optimize) {
        case 'minimal':
          query = `COPY (SELECT * FROM ${table}) TO '${this.outputPath}/${file}' (FORMAT PARQUET)`;
          break;
        case 'more':
        case 'most':
          if (relevant_columns === null) {
            query = `COPY (SELECT * FROM ${table}) TO '${this.outputPath}/${file}' (FORMAT PARQUET)`;
          } else {
            this.logger.warn(`Partially exporting table: ${table}`);
            query = `COPY (SELECT ${Array.from(relevant_columns).join(', ')} FROM ${table}) TO '${this.outputPath}/${file}' (FORMAT PARQUET)`;
          }
          break;
        default:
          throw new PublishError(`Invalid optimization level: ${this.optimize}`);
      }

      if (table.startsWith('mosaic.preagg_')) {
        materialized_view_copy_queries.push(query);
      } else {
        table_copy_queries.push(query);
      }
    }

    if (table_copy_queries.length > 0 || materialized_view_copy_queries.length > 0) {
      this.logger.info('Exporting data tables to Parquet...');
      fs.mkdirSync(path.join(this.outputPath, 'data'), { recursive: true });
      await this.ctx.coordinator.exec(table_copy_queries);

      if (materialized_view_copy_queries.length > 0) {
        this.logger.info('Exporting materialized views to Parquet...');
        fs.mkdirSync(path.join(this.outputPath, 'data/.mosaic'), { recursive: true });
        await this.ctx.coordinator.exec(materialized_view_copy_queries);
      }
    }
  }
}

class SchemaCreateNode extends QueryDataNode {
  schema: string;

  constructor(name: string, schema: string) {
    super(name, "schema");
    this.schema = schema;
  }

  public codegenQuery(ctx: CodegenContext) {
    return `'CREATE SCHEMA IF NOT EXISTS ${this.schema};'`;
  }
}