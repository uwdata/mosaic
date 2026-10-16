import { coordinator, isSelection } from '@uwdata/mosaic-core';
import { parseSpec, astToDOM } from '@uwdata/mosaic-spec';
import './style.css';
import { v4 as uuidv4 } from 'uuid';
/**
 * @import { Connector, Selection, ArrowQueryRequest, ExecQueryRequest, ArrowIPCBytes} from '@uwdata/mosaic-core'
 * @import { Spec } from '@uwdata/mosaic-spec'
 */

/**
 * @typedef {Record<string, {value: unknown, predicate?: string}>} Params
 *
 * @typedef Model
 * @property {Spec} spec
 *  The current Mosaic specification.
 * @property {string} preagg_schema The database schema in which to store
 *  pre-aggregated materialized views (default 'mosaic').
 * @property {Params} params The current params.
 */

/** @type {import('anywidget/types').AnyWidget<Model>} */
export default {
  initialize(view) {
    view.model.set('preagg_schema', coordinator().preaggregator.schema);
  },

  render(view) {
    view.el.classList.add('mosaic-widget');
    const getSpec = () => view.model.get('spec');
    const getPreaggSchema = () => view.model.get('preagg_schema');
    const logger = coordinator().logger();

    /** @type Map<string, {query: ArrowQueryRequest | ExecQueryRequest, startTime: number, resolve: (value: any) => ArrowIPCBytes | void, reject: (reason?: any) => void}> */
    const openQueries = new Map();

    /**
     * @param {ArrowQueryRequest | ExecQueryRequest} query the query to send
     * @param {(value: any) => ArrowIPCBytes | void} resolve the promise resolve callback
     * @param {(reason?: any) => void} reject the promise reject callback
     */
    function send(query, resolve, reject) {
      const uuid = uuidv4();

      openQueries.set(uuid, {
        query,
        startTime: performance.now(),
        resolve,
        reject,
      });
      view.model.send({ ...query, uuid });
    }

    /** @type {Connector} */
    const connector = {
      // @ts-ignore
      query(query) {
        return new Promise((resolve, reject) => send(query, resolve, reject));
      },
    };

    function reset() {
      coordinator().clear();
    }

    /**
     * Serialize a selection's resolved predicate — a single expression or an
     * implicitly conjunctive array — to a SQL string.
     * @param {Selection} selection
     * @returns {string}
     */
    function predicateSQL(selection) {
      const predicate = selection.predicate(undefined) ?? [];
      const parts = (Array.isArray(predicate) ? predicate : [predicate]).map(String);
      return parts.length > 1 ? parts.map(s => `(${s})`).join(' AND ') : (parts[0] ?? '');
    }

    /** @type {string} */
    let appliedSpecJSON;

    async function updateSpec() {
      const spec = getSpec();
      const specJSON = JSON.stringify(spec);
      if (specJSON === appliedSpecJSON) return;
      appliedSpecJSON = specJSON;
      reset();
      logger.log('Setting spec:', spec);
      const dom = await instantiateSpec(spec);
      view.el.replaceChildren(dom.element);

      /** @type Params */
      let params = {};

      for (const [name, param] of dom.params) {
        params[name] = {
          value: param.value,
          ...(isSelection(param) ? { predicate: predicateSQL(param) } : {}),
        };

        param.addEventListener('value', (value) => {
          params = Object.freeze({
            ...params,
            [name]: {
              value,
              ...(isSelection(param) ? { predicate: predicateSQL(param) } : {})
            }
          })
          view.model.set('params', params);
          view.model.save_changes();
        });
      }

      params = Object.freeze(params);
      view.model.set('params', params);
      view.model.save_changes();
    }

    /** @param {unknown} error */
    function showError(error) {
      logger.error(error);
      const pre = document.createElement('pre');
      pre.className = 'error';
      pre.textContent = String(error);
      view.el.replaceChildren(pre);
    }

    view.model.on('change:spec', () => updateSpec().catch(showError));

    function configureCoordinator() {
      coordinator().preaggregator.schema = getPreaggSchema();
    }

    view.model.on('change:preagg_schema', () => configureCoordinator());

    view.model.on('msg:custom', (msg, buffers) => {
      logger.group(`query ${msg.uuid}`);
      logger.log('received message', msg, buffers);

      const query = openQueries.get(msg.uuid);
      openQueries.delete(msg.uuid);

      // @ts-ignore
      logger.log(query.query.sql, (performance.now() - query.startTime).toFixed(1));

      if (msg.error) {
        // @ts-ignore
        query.reject(msg.error);
        showError(msg.error);
      } else {
        switch (msg.type) {
          case 'arrow': {
            logger.log('arrow bytes', buffers[0].buffer.byteLength);
            // @ts-ignore
            query.resolve(buffers[0].buffer);
            break;
          }
          default: {
            // @ts-ignore
            query.resolve({});
            break;
          }
        }
      }
      logger.groupEnd();
    });

    coordinator().databaseConnector(connector);
    configureCoordinator();
    updateSpec().catch(showError);

    return () => {
      // cleanup
      reset();
    };
  },
};

/** @param {Spec} spec */
function instantiateSpec(spec) {
  // parse specification, and instantiate it
  // astToDOM creates a new vgplot API context with the
  // standard coordinator and a custom namedPlots map
  return astToDOM(parseSpec(spec));
}
