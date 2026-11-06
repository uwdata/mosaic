import { coordinator, isSelection } from '@uwdata/mosaic-core';
import { parseSpec, astToDOM, Spec } from '@uwdata/mosaic-spec';
import type * as mc from '@uwdata/mosaic-core';
import type * as aw from 'anywidget/types';
import './style.css';
import { v4 as uuidv4 } from 'uuid';

type Params = Record<string, { value: unknown, predicate?: string }>;

/** Model object.
 *
 * @property spec The current Mosaic specification.
 * @property preagg_schema The database schema in which to store pre-aggregated materialized views (default 'mosaic').
 * @property params The current params.
 */
interface Model {
  spec: Spec;
  preagg_schema: string;
  params: Params;
}

//TODO @dangotbanned: https://github.com/microsoft/TypeScript/issues/420
/** @type {aw.AnyWidget<Model>} */
export default {
  initialize(view) {
    view.model.set('preagg_schema', coordinator().preaggregator.schema);
  },

  render(view) {
    view.el.classList.add('mosaic-widget');
    const getSpec = () => view.model.get('spec');
    const getPreaggSchema = () => view.model.get('preagg_schema');
    const logger = coordinator().logger();

    const openQueries: Map<string, { query: Record<any, unknown>; startTime: number; resolve: (value: any) => void; reject: (reason?: any) => void; }> = new Map();

    function send(query: Record<any, unknown>, resolve: (value: any) => void, reject: (reason?: any) => void) {
      const uuid = uuidv4();

      openQueries.set(uuid, {
        query,
        startTime: performance.now(),
        resolve,
        reject,
      });
      view.model.send({ ...query, uuid });
    }


    const connector: mc.Connector = {
      //@ts-expect-error Type 'unknown' is not assignable to type 'ArrowIPCBytes'.
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
     */
    function predicateSQL(selection: mc.Selection): string {
      const predicate = selection.predicate(undefined) ?? [];
      const parts = (Array.isArray(predicate) ? predicate : [predicate]).map(String);
      return parts.length > 1 ? parts.map(s => `(${s})`).join(' AND ') : (parts[0] ?? '');
    }

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

      let params: Params = {};

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

      logger.log(query.query.sql, (performance.now() - query.startTime).toFixed(1));

      if (msg.error) {
        query.reject(msg.error);
        showError(msg.error);
      } else {
        switch (msg.type) {
          case 'arrow': {
            logger.log('arrow bytes', buffers[0].buffer.byteLength);
            query.resolve(buffers[0].buffer);
            break;
          }
          default: {
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

function instantiateSpec(spec) {
  // parse specification, and instantiate it
  // astToDOM creates a new vgplot API context with the
  // standard coordinator and a custom namedPlots map
  return astToDOM(parseSpec(spec));
}
