import { coordinator, namedPlots } from '@uwdata/vgplot';
import { isSelection } from '@uwdata/mosaic-core';
import { parseSpec, astToDOM } from '@uwdata/mosaic-spec';
import * as arrow from 'apache-arrow';
import './style.css';
import { v4 as uuidv4 } from 'uuid';

/**
 * @typedef {Record<string, {value: unknown, predicate?: string}>} Params
 *
 * @typedef Model
 * @prop {import('@uwdata/mosaic-spec').Spec} spec the current specification
 * @prop {boolean} temp_indexes whether data cube indexes should be created as temp tables
 * @prop {Params} params the current params
 */

export default {
  /** @type {import('anywidget/types').Initialize<Model>} */
  // eslint-disable-next-line no-unused-vars
  initialize(view) {},

  /** @type {import('anywidget/types').Render<Model>} */
  render(view) {
    view.el.classList.add('mosaic-widget');

    const getSpec = () => view.model.get('spec');

    const getTempIndexes = () => view.model.get('temp_indexes');

    const logger = coordinator().logger();

    /** @type Map<string, {query: Record<any, unknown>, startTime: number, resolve: (value: any) => void, reject: (reason?: any) => void}> */
    const openQueries = new Map();

    /**
     * @param {Record<any, unknown>} query the query to send
     * @param {(value: any) => void} resolve the promise resolve callback
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

    const connector = {
      query(query) {
        return new Promise((resolve, reject) => send(query, resolve, reject));
      },
    };

    function reset() {
      coordinator().clear();
      namedPlots.clear();
    }

    async function updateSpec() {
      const spec = getSpec();
      reset();
      logger.log('Setting spec:', spec);
      const dom = await instantiateSpec(spec);
      view.el.replaceChildren(dom.element);

      /** @type Params */
      const params = {};

      for (const [name, param] of dom.params) {
        params[name] = {
          value: param.value,
          ...(isSelection(param) ? { predicate: String(param.predicate()) } : {}),
        };

        param.addEventListener('value', (value) => {
          params[name] = {
            value,
            ...(isSelection(param) ? { predicate: String(param.predicate()) } : {}),
          };
          view.model.set('params', params);
          view.model.save_changes();
        });
      }

      view.model.set('params', params);
      view.model.save_changes();
    }

    view.model.on('change:spec', () => updateSpec());

    function configureCoordinator() {
      const indexes = { temp: getTempIndexes() };
      coordinator().configure({ indexes });
    }

    view.model.on('change:temp_indexes', () => configureCoordinator());

    view.model.on('msg:custom', (msg, buffers) => {
      logger.group(`query ${msg.uuid}`);
      logger.log('received message', msg, buffers);

      const query = openQueries.get(msg.uuid);
      openQueries.delete(msg.uuid);

      logger.log(query.query.sql, (performance.now() - query.startTime).toFixed(1));

      if (msg.error) {
        query.reject(msg.error);
        logger.error(msg.error);
      } else {
        switch (msg.type) {
          case 'arrow': {
            const table = arrow.tableFromIPC(buffers[0].buffer);
            logger.log('table', table);
            query.resolve(table);
            break;
          }
          case 'json': {
            logger.log('json', msg.result);
            query.resolve(msg.result);
            break;
          }
          default: {
            query.resolve({});
            break;
          }
        }
      }
      logger.groupEnd('query');
    });

    coordinator().databaseConnector(connector);
    configureCoordinator();
    updateSpec();

    return () => {
      // cleanup
      reset();
    };
  },
};

function instantiateSpec(spec) {
  const ast = parseSpec(spec);
  return astToDOM(ast);
}
