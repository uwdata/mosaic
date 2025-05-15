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
} from '@uwdata/mosaic-spec';
import { MosaicClient, isClauseSource } from '@uwdata/mosaic-core';

// Utility imports
import {
  preamble, PreambleOptions, htmlTemplate, templateCSS,
  publishConnector, PublishContext, mockCanvas,
  VGPLOT, FLECHETTE,
  LogLevel, Logger,
  clientsReady,
  OPTIMIZATION_LEVEL_TO_OPTIMIZATIONS, Optimizations,
} from './util/index.js';
import { binary, map, tableFromArrays, tableToIPC, utf8 } from "@uwdata/flechette";

/**
 * Enum for publish exit codes.
 */
export enum PublishExitCode {
  SUCCESS = 0,
  FILE_READ_ERROR = 1,
  SPEC_PARSE_ERROR = 2,
  PUBLISH_ERROR = 3,
  OUTPUT_DIR_ERROR = 4,
  FILE_WRITE_ERROR = 5,
  BUNDLE_ERROR = 6,
  UNKNOWN_ERROR = 10
}

/**
 * Error class for known publishing errors, with exit code.
 * @param message Error message.
 * @param code Exit code.
 */
export class PublishError extends Error {
  code: PublishExitCode;
  constructor(message: string, code: PublishExitCode = PublishExitCode.PUBLISH_ERROR) {
    super(message);
    this.name = 'PublishError';
    this.code = code;
  }
}

export type MosaicPublisherOptions = {
  spec: string;
  outputPath?: string;
  title?: string;
  optimize?: 'none' | 'minimal' | 'more' | 'most';
  logger?: Logger;
  customScript?: string;
  overwrite?: boolean;
};

/**
 * Class to facilitate publishing a Mosaic specification.
 * @param options Options for configuring the MosaicPublisher instance.
 * @param options.spec Contents of JSON Mosaic specification file.
 * @param options.outputPath Path to the desired output directory.
 * @param options.title Optional title for the HTML file.
 * @param options.optimize Level of optimization for published visualization.
 * @param options.logger Optional logger instance to use for logging.
 * @param options.customScript Optional custom script to include in the output.
 * @param options.overwrite Whether to overwrite the output directory if it exists.
 * 
 * The `publish` method is the main entry point for the class
 */
export class MosaicPublisher {
  private spec: string;
  private outputPath: string;
  private title: string;
  private optimizations: Optimizations[];
  private logger: Logger;
  private customScript: string = '';
  private overwrite: boolean;

  // Internal references used throughout
  private ctx: PublishContext;
  private ast?: SpecNode;
  private data?: Record<string, DataNode>;
  private db: ReturnType<typeof publishConnector>;

  constructor({
    spec,
    outputPath = 'out',
    title = 'Mosaic Visualization',
    optimize = 'minimal',
    logger = new Logger(LogLevel.INFO),
    customScript = '',
    overwrite = false
  }: MosaicPublisherOptions) {
    this.spec = spec;
    this.outputPath = outputPath;
    this.title = title;
    this.optimizations = OPTIMIZATION_LEVEL_TO_OPTIMIZATIONS[optimize];
    this.logger = logger;
    this.customScript = customScript;
    this.overwrite = overwrite;

    // Create PublishContext
    this.db = publishConnector();
    this.ctx = new PublishContext(this.db);
  }

  /**
   * Main entry point for publishing a Mosaic specification.
   * @param returnData If true, return generated HTML/JS as an object instead of writing files.
   */
  public async publish(returnData?: boolean): Promise<void | { html: string; js?: string }> {
    this.logger.info('Parsing and processing spec...');

    // Parse specification
    try {
      this.ast = parseSpec(yaml.parse(this.spec));
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to parse specification: ${err}`, PublishExitCode.SPEC_PARSE_ERROR);
    }
    if (!this.ast) return;
    this.data = this.ast.data;

    // Setup jsdom
    try {
      const dom = new JSDOM(
        `<!DOCTYPE html><body></body>`,
        { pretendToBeVisual: true }
      );
      globalThis.window = dom.window as any;
      globalThis.document = dom.window.document;
      globalThis.navigator ??= dom.window.navigator;
      globalThis.requestAnimationFrame = window.requestAnimationFrame;
      mockCanvas(globalThis.window);
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to initialize DOM: ${err}`, PublishExitCode.PUBLISH_ERROR);
    }

    // Load the visualization in the DOM and gather interactors/inputs
    let element;
    try {
      const domResult = await astToDOM(this.ast, { api: this.ctx.api });
      element = domResult.element;
      document.body.appendChild(element);
      await clientsReady(this.ctx);
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to process spec DOM: ${err}`, PublishExitCode.PUBLISH_ERROR);
    }

    const clauseSources = this.ctx.coordinator.clauseSources;
    if (!clauseSources) throw new PublishError(
      'No clause sources on coordinator. This should never happen.',
      PublishExitCode.PUBLISH_ERROR
    );
    const isInteractive = clauseSources.size !== 0;
    const needsJS = isInteractive || !this.optimizations.includes(Optimizations.PRERENDER);

    // If spec is valid create relevant output directory
    try {
      if (fs.existsSync(this.outputPath)) {
        if (!this.overwrite) {
          throw new PublishError(
            `Output directory '${this.outputPath}' already exists. Use --overwrite to allow replacing it\n\tNOTE: This will delete all existing files in the directory.`,
            PublishExitCode.OUTPUT_DIR_ERROR
          );
        }
        this.logger.warn(`Clearing output directory: ${this.outputPath}`);
        fs.rmSync(this.outputPath, { recursive: true });
        fs.mkdirSync(this.outputPath, { recursive: true });
      } else {
        this.logger.info(`Creating output directory: ${this.outputPath}`);
        fs.mkdirSync(this.outputPath, { recursive: true });
      }
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to create or clear output directory: ${err}`, PublishExitCode.OUTPUT_DIR_ERROR);
    }

    let postLoad;
    if (needsJS) {
      // Activate interactors and inputs
      if (isInteractive) await this.activateClauseSources(clauseSources);

      // Modify AST and process data (extensions, data definitions, etc.)
      const og = FileDataNode.prototype.codegenQuery;
      FileDataNode.prototype.codegenQuery = function (ctx: CodegenContext) {
        const code = og.call(this, ctx);
        const { file } = this;
        return code?.replace(`"${file}"`, `window.location.origin + "/${file}"`);
      };

      const tables = this.db.tables();
      postLoad = await this.updateDataNodes(tables);
      // Export relevant data from DuckDB to Parquet
      try {
        await this.exportDataFromDuckDB(tables);
      } catch (err) {
        if (err instanceof PublishError) throw err;
        throw new PublishError(`Failed to export data from DuckDB: ${err}`, PublishExitCode.FILE_WRITE_ERROR);
      }
    }

    let result;
    try {
      result = await this.writeFiles(
        needsJS,
        this.optimizations.includes(Optimizations.PRERENDER) ? element : undefined,
        postLoad,
        returnData
      );
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to write output files: ${err}`, PublishExitCode.FILE_WRITE_ERROR);
    }
    if (returnData) return result;
  }

  private processClients() {
    const interactors = new Set<any>();
    const inputs = new Set<MosaicClient>();
    if (!this.ctx.coordinator.clients) return { interactors, inputs };

    for (const client of this.ctx.coordinator.clients) {
      if (client instanceof MosaicClient && isClauseSource(client)) {
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
  private async activateClauseSources(clauseSources: Set<any>) {
    for (const cs of clauseSources) {
      if (isClauseSource(cs)) cs.activate();
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
  private async updateDataNodes(tables: Record<string, Set<string> | null>): Promise<string | undefined> {
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
    this.logger.debug(`DB Tables: ${JSON.stringify(db_tables, null, 2)}`);
    if (this.optimizations.includes(Optimizations.PREAGREGATE)
      && db_tables.some((table: any) => table.name.startsWith('preagg_'))) {
      let postLoad = "getVgInstance().coordinator().exec([\n\t'CREATE SCHEMA IF NOT EXISTS mosaic;',\n";
      const genCtx = new CodegenContext({
        namespace: 'getVgInstance()'
      });

      for (const table of db_tables) {
        if (table.name.startsWith('preagg_')) {
          const name = `${table.schema}.${table.name}`;
          tables[name] = null;
          const file = `data/.mosaic/${table.name}.parquet`;
          this.ast!.data[name] = new ParquetDataNode(name, file, new OptionsNode({}));
          postLoad += `\t${this.ast!.data[name].codegenQuery(genCtx)},\n`;
        } else if (table.name in tables && tables[table.name] == new Set(table.column_names)) {
          tables[table.name] = null;
        }
      }
      postLoad += "], {priority: 2})";
      return postLoad;
    }
    return undefined;
  }

  /**
   * Write out the index.js, index.html, and create data/ directory as needed.
   */
  private async writeFiles(
    needsJS: boolean,
    element?: HTMLElement | SVGElement,
    postLoad?: string,
    returnData?: boolean
  ): Promise<void | { html: string; js?: string }> {
    let preambleOptions: PreambleOptions = { cacheFile: undefined }
    if (this.optimizations.includes(Optimizations.LOAD_CACHE) && needsJS) {
      const cache = this.ctx.coordinator.manager.cache().export();
      const cacheFile = '.cache.arrow';
      if (cache) {
        try {
          const cacheBytes = tableToIPC(tableFromArrays({ cache: [cache] }, {
            types: {
              cache: map(utf8(), binary())
            }
          }), {})!;
          fs.writeFileSync(path.join(this.outputPath, cacheFile), cacheBytes);
          preambleOptions.cacheFile = cacheFile;
        } catch (err) {
          if (err instanceof PublishError) throw err;
          throw new PublishError(`Failed to write cache file: ${err}`, PublishExitCode.FILE_WRITE_ERROR);
        }
      }
    }

    let code, html;
    try {
      code = astToESM(this.ast!, {
        connector: 'wasm',
        imports: new Map([[VGPLOT, '* as vg'], [FLECHETTE, '{ tableFromIPC }']]),
        preamble: preamble(preambleOptions),
      });
      html = htmlTemplate({
        title: this.title,
        css: templateCSS,
        postLoad,
        needsJS,
        element,
        customScript: this.customScript,
      });
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to generate code or HTML: ${err}`, PublishExitCode.PUBLISH_ERROR);
    }

    if (returnData) {
      return needsJS ? { html, js: code } : { html };
    }

    try {
      fs.writeFileSync(path.join(this.outputPath, 'index.html'), html);
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to write index.html: ${err}`, PublishExitCode.FILE_WRITE_ERROR);
    }
    if (needsJS) {
      let bundle;
      try {
        bundle = await rollup({
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
      } catch (err) {
        if (err instanceof PublishError) throw err;
        throw new PublishError(`Failed to bundle JavaScript: ${err}`, PublishExitCode.BUNDLE_ERROR);
      }
      try {
        await bundle.write({
          dir: this.outputPath,
          format: 'esm',
          entryFileNames: 'index.js',
        });
      } catch (err) {
        if (err instanceof PublishError) throw err;
        throw new PublishError(`Failed to write bundle files: ${err}`, PublishExitCode.FILE_WRITE_ERROR);
      }
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
      if (relevant_columns?.size === 0 && this.optimizations.includes(Optimizations.DATASHAKE)) {
        this.logger.warn(`Skipping export of table: ${table}`);
        this.logger.warn(`No columns are being used from this table.`);
        continue;
      }

      let query: string;
      if (this.optimizations.includes(Optimizations.PROJECTION) && relevant_columns) {
        this.logger.warn(`Partially exporting table: ${table}`);
        query = `COPY (SELECT ${Array.from(relevant_columns).join(', ')} FROM ${table}) TO '${this.outputPath}/${file}' (FORMAT PARQUET)`;
      } else {
        query = `COPY (SELECT * FROM ${table}) TO '${this.outputPath}/${file}' (FORMAT PARQUET)`;
      }

      if (table.startsWith('mosaic.preagg_')) {
        materialized_view_copy_queries.push(query);
        delete this.ast!.data[table];
      } else {
        table_copy_queries.push(query);
      }
    }

    try {
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
    } catch (err) {
      if (err instanceof PublishError) throw err;
      throw new PublishError(`Failed to export Parquet files: ${err}`, PublishExitCode.FILE_WRITE_ERROR);
    }
  }
}
