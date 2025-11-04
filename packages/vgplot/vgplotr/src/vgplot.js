import { coordinator } from '@uwdata/mosaic-core';
import { parseSpec, astToDOM } from '@uwdata/mosaic-spec';
import { wasmConnector } from '@uwdata/mosaic-sql';
import * as duckdb from '@duckdb/duckdb-wasm';

/**
 * Initialize DuckDB WASM instance
 */
async function initDuckDB() {
  // Get base URL for DuckDB WASM files
  const basePath = HTMLWidgets.getWidgetBasePath('vgplot');
  const DUCKDB_CONFIG = {
    mvp: {
      mainModule: `${basePath}/lib/duckdb/duckdb-mvp.wasm`,
      mainWorker: `${basePath}/lib/duckdb/duckdb-browser-mvp.worker.js`
    },
    eh: {
      mainModule: `${basePath}/lib/duckdb/duckdb-eh.wasm`,
      mainWorker: `${basePath}/lib/duckdb/duckdb-browser-eh.worker.js`
    }
  };

  // Select bundle based on browser capabilities
  const bundle = await duckdb.selectBundle(DUCKDB_CONFIG);

  // Instantiate DuckDB
  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);

  return db;
}

/**
 * HTMLWidgets binding for vgplot
 */
HTMLWidgets.widget({
  name: 'vgplot',
  type: 'output',

  factory: function(el, width, height) {
    let db = null;
    let connection = null;
    let currentCoordinator = null;

    return {
      renderValue: async function(x) {
        try {
          // Initialize DuckDB WASM if not already done
          if (!db) {
            el.innerHTML = '<div style="padding: 20px; color: #666;">Initializing DuckDB WASM...</div>';
            db = await initDuckDB();
            connection = await db.connect();
            console.log('DuckDB WASM initialized');
          }

          // Clear previous content
          el.innerHTML = '';
          el.classList.add('vgplot-widget');

          // Create new coordinator for this widget
          const coord = coordinator();
          currentCoordinator = coord;

          // Set up DuckDB WASM connector
          const connector = wasmConnector({ connection });
          coord.databaseConnector(connector);

          // Parse and render the spec
          const spec = x.spec;
          console.log('Rendering spec:', spec);

          // Parse specification and convert to DOM
          const ast = parseSpec(spec);
          const dom = await astToDOM(ast);

          // Append to element
          el.appendChild(dom.element);

          console.log('vgplot rendered successfully');
        } catch (error) {
          console.error('Error rendering vgplot:', error);
          el.innerHTML = `<div style="padding: 20px; color: red;">
            <strong>Error rendering vgplot:</strong><br>
            ${error.message}
            <pre style="margin-top: 10px; font-size: 12px;">${error.stack}</pre>
          </div>`;
        }
      },

      resize: function(width, height) {
        // Handle resize if needed
        // Most plots will auto-resize based on container
      },

      // Clean up
      destroy: function() {
        if (currentCoordinator) {
          currentCoordinator.clear();
        }
        if (connection) {
          connection.close();
        }
      }
    };
  }
});
