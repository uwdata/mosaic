import yaml from "yaml";
import fs from 'fs';
import { JSDOM } from 'jsdom';
import chalk from 'chalk';
import path from "path";

// Mosaic modules
import { 
  parseSpec, astToESM, astToDOM, 
  SpecNode, DataNode, FileDataNode, 
  ParquetDataNode, OptionsNode, 
  CodegenContext, 
  QueryDataNode,
} from '@uwdata/mosaic-spec';
import { ExprNode, ColumnNameRefNode } from '@uwdata/mosaic-sql';
import { MosaicClient } from '../../vgplot/src/index.js';
import { Interactor } from '@uwdata/mosaic-plot/src/interactors/Interactor.js';
import { Input } from '@uwdata/mosaic-inputs/src/input.js';

// Utility imports
import { 
  clientsReady, htmlTemplate, mockCanvas, 
  publishConnector, PublishContext, templateCSS, VGPLOT,
  LogLevel, Logger,
  preamble
} from './util/index.js';

/**
 * Class to facilitate publishing a Mosaic specification.
 * @param specPath Path to the Mosaic specification file.
 * @param outputPath Path to the desired output directory.
 * @param title Optional title for the HTML file.
 * @param optimize Level of optimization for published visualization.
 * @param logLevel Desired logging level (debug, info, warn, error, silent)
 * 
 * The `publish` method is the main entry point for the class
 */
export class MosaicPublisher {
  private specPath: string;
  private outputPath: string;
  private title?: string;
  private optimize: 'minimal' | 'more' | 'most';
  private logger: Logger;

  // Internal references used throughout
  private ctx: PublishContext;
  private ast?: SpecNode;
  private data?: Record<string, DataNode>;
  
  constructor(
    specPath: string, 
    outputPath: string, 
    title: string | undefined, 
    optimize: 'minimal' | 'more' | 'most',
    logLevel: LogLevel
  ) {
    this.specPath = specPath;
    this.outputPath = outputPath;
    this.title = title;
    this.optimize = optimize;

    // Create our logger instance
    this.logger = new Logger(logLevel);

    // Create PublishContext
    const connector = publishConnector();
    this.ctx = new PublishContext(connector);
    if (logLevel !== 'debug') {
      this.ctx.coordinator.logger(false);
    }
  }

  /**
   * Main entry point for publishing a Mosaic specification.
   */
  public async publish() {
    this.logger.info(chalk.cyan('Parsing and processing specification...'));
    
    // Parse specification
    this.parseSpecification();
    if (!this.ast) return;
    this.data = this.ast.data;

    // If spec is valid create relevant output directory
    if (fs.existsSync(this.outputPath)) {
      this.logger.debug(`Removing existing directory: ${this.outputPath}`);
      fs.rmSync(this.outputPath, { recursive: true });
    }
    this.logger.debug(`Creating directory: ${this.outputPath}`);
    fs.mkdirSync(this.outputPath, { recursive: true });
    
    // Setup jsdom
    this.logger.debug('Setting up jsdom environment...');
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
    // TODO: fix type issue with astToDOM to remove the any cast
    const { element } = await astToDOM(this.ast, {api: this.ctx.api} as any);
    document.body.appendChild(element);
    this.logger.debug('Waiting for clients to be ready...');
    await clientsReady(this.ctx);

    const { interactors, inputs, tables } = this.processClients();
    const isInteractive = interactors.size + inputs.size !== 0;
    
    if (isInteractive) {
      // Activate interactors and inputs
      this.logger.info(chalk.cyan('Activating interactive elements...'));
      await this.activateInteractorsAndInputs(interactors, inputs);

      // Modify AST and process data (extensions, data definitions, etc.)
      const og = FileDataNode.prototype.codegenQuery;
      FileDataNode.prototype.codegenQuery = function(ctx: CodegenContext) {
        const code = og.call(this, ctx);
        const { file } = this;
        return code?.replace(`"${file}"`, `window.location.origin + "/${file}"`);
      };
      this.logger.debug('Updating data nodes...');
      await this.updateDataNodes(tables);

      // Export relevant data from DuckDB to Parquet
      this.logger.info(chalk.cyan('Exporting data to Parquet...'));
      await this.exportDataFromDuckDB(tables);
    }

    this.logger.info(chalk.cyan('Writing output files...'));
    this.writeFiles(isInteractive, element);
  }

  private parseSpecification() {
    try {
      const specFile = fs.readFileSync(this.specPath, 'utf-8');
      this.ast = parseSpec(yaml.parse(specFile));
    } catch (e) {
      console.error('Error parsing spec:', e);
      process.exit(1);
    }
  }

  private processClients() {
    this.logger.debug('--------------- Clients ---------------');

    const interactors = new Set<Interactor>();
    const inputs = new Set<Input>();
    const tables: Record<string, Set<string>> = {};

    for (const client of this.ctx.coordinator.clients) {
      this.logger.debug(client.constructor.name);
      if (client instanceof MosaicClient) {
        const fields = client.fields();
        if (fields) {
          for (const field of fields) {
            const { table, column } = field;
            if (!(table in tables)) tables[table] = new Set();
            if (column instanceof ExprNode) {
              if (column instanceof ColumnNameRefNode) {
                tables[table].add(column.column);
              }
            } else {
              tables[table].add(column);
            }
          }
        }
      }
      if (client instanceof Input) {
        inputs.add(client);
        
        const input = client as any; // TODO: change Input class to make this cleaner
        if (input.from && input.column) {
          if (!(input.from in tables)) tables[input.from] = new Set();
          tables[input.from].add(input.column);
        }
      }
      if (client.plot) {
        for (const interactor of client.plot.interactors) {
          interactors.add(interactor);
        }
      }
    }
    return { interactors, inputs, tables };
  }

  /**
   * Activate the Interactors and Inputs, waiting 
   * for queries to finish.
   */
  private async activateInteractorsAndInputs(interactors: Set<Interactor>, inputs: Set<Input>) {
    this.logger.debug('--------------- Activating ---------------');
    for (const interactor of interactors) {
      this.logger.debug(interactor.constructor.name);
      interactor.activate();
      await this.waitForQueryToFinish();
    }

    for (const input of inputs) {
      this.logger.debug(input.constructor.name);
      input.activate();
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
  private async updateDataNodes(tables: Record<string, Set<string>>) {
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
    const db_tables = await this.ctx.coordinator.query('SHOW ALL TABLES', { type: 'json' });
    if (db_tables.some((table: any) => table.name.startsWith('preagg_'))) {
      this.ast!.data['schema'] = new SchemaCreateNode('schema', 'mosaic');
      for (const table of db_tables) {
        if (table.name.startsWith('preagg_')) {
          const name = `${table.schema}.${table.name}`;
          tables[name] = new Set(table.column_names);
          const file = `data/.mosaic/${table.name}.parquet`;
          this.ast!.data[name] = new ParquetDataNode(name, file, new OptionsNode({}));
        }
      }
    }
  }

  /**
   * Write out the index.js, index.html, and create data/ directory as needed.
   */
  private writeFiles(isInteractive: boolean, element?: HTMLElement | SVGElement) {
    const code = astToESM(this.ast!, {
      connector: 'wasm',
      imports: new Map([[VGPLOT, '* as vg']]),
      preamble: this.optimize == 'most' ? preamble : undefined
    });
    const html = htmlTemplate(isInteractive, this.title, element, templateCSS);

    fs.writeFileSync(path.join(this.outputPath, 'index.html'), html);
    if (isInteractive) {
      fs.writeFileSync(path.join(this.outputPath, 'index.js'), code);
    }
  }

  /**
   * Export relevant data from DuckDB to local Parquet
   */
  private async exportDataFromDuckDB(tables: Record<string, Set<string>>) {
    const copy_queries: string[] = [];
    for (const node of Object.values(this.data!)) {
      if (!(node instanceof ParquetDataNode)) continue;
      const table = node.name;
      const file = node.file;
      const relevant_columns = tables[table];
      if (relevant_columns.size === 0) {
        this.logger.debug(`No relevant columns found for table ${table}`);
        continue;
      }

      let query: string;
      switch (this.optimize) {
        case 'minimal':
          query = `COPY (SELECT * FROM ${table}) TO '${this.outputPath}/${file}' (FORMAT PARQUET)`;
          break;
        case 'more':
        case 'most':
          query = `COPY (SELECT ${Array.from(relevant_columns).join(', ')} FROM ${table}) TO '${this.outputPath}/${file}' (FORMAT PARQUET)`;
          break;
        default:
          throw new Error(`Invalid optimization level: ${this.optimize}`);
      }
      copy_queries.push(query);
    }

    if (copy_queries.length > 0) {
      // TODO: Make the following conditionally on data needs
      fs.mkdirSync(path.join(this.outputPath, 'data'), { recursive: true });
      fs.mkdirSync(path.join(this.outputPath, 'data/.mosaic'), { recursive: true });

      await this.ctx.coordinator.exec(copy_queries);
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