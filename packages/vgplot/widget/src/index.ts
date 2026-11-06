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

interface OpenQuery {
  query: mc.ArrowQueryRequest | mc.ExecQueryRequest;
  startTime: number;
  resolve: (value: ArrayBufferLike | Record<string, unknown>) => void;
  reject: (reason?: string) => void;
}

interface Msg {
  uuid: string;
  type: OpenQuery['query']['type'];
  error?: string;
}

//TODO @dangotbanned: https://github.com/microsoft/TypeScript/issues/420
/** @type {aw.AnyWidget<Model>} */
export default {
  initialize({ model }: aw.InitializeProps<Model>): void {
    model.set('preagg_schema', coordinator().preaggregator.schema);
  },

  render({ model, el }: aw.RenderProps<Model>): () => void {
    el.classList.add('mosaic-widget');
    const getSpec = () => model.get('spec');
    const getPreaggSchema = () => model.get('preagg_schema');
    const logger = coordinator().logger();

    const openQueries: Map<string, OpenQuery> = new Map();

    function send({ query, resolve, reject }: Omit<OpenQuery, 'startTime'>): void {
      const uuid = uuidv4();

      openQueries.set(uuid, {
        query,
        startTime: performance.now(),
        resolve,
        reject,
      });
      model.send({ ...query, uuid });
    }


    const connector: mc.Connector = {
      query(query: OpenQuery['query']): Promise<any> {
        return new Promise((resolve, reject) => send({ query, resolve, reject }));
      },
    };

    function reset(): void {
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

    let appliedSpecJSON = '';

    async function updateSpec(): Promise<void> {
      const spec = getSpec();
      const specJSON = JSON.stringify(spec);
      if (specJSON === appliedSpecJSON) return;
      appliedSpecJSON = specJSON;
      reset();
      logger.log('Setting spec:', spec);
      const dom = await instantiateSpec(spec);
      el.replaceChildren(dom.element);

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
          model.set('params', params);
          model.save_changes();
        });
      }

      params = Object.freeze(params);
      model.set('params', params);
      model.save_changes();
    }

    function showError(error: unknown): void {
      logger.error(error);
      const pre = document.createElement('pre');
      pre.className = 'error';
      pre.textContent = String(error);
      el.replaceChildren(pre);
    }

    model.on('change:spec', () => updateSpec().catch(showError));

    function configureCoordinator() {
      coordinator().preaggregator.schema = getPreaggSchema();
    }

    model.on('change:preagg_schema', () => configureCoordinator());

    model.on('msg:custom', (msg: Msg, buffers: DataView[]): void => {
      logger.group(`query ${msg.uuid}`);
      logger.log('received message', msg, buffers);

      const query = openQueries.get(msg.uuid);
      if (typeof query === 'undefined') {
        throw new Error(`Query ${msg.uuid} not found`);
      }
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

    return (): void => {
      // cleanup
      reset();
    };
  },
};

function instantiateSpec(spec: Spec): ReturnType<typeof astToDOM> {
  // parse specification, and instantiate it
  // astToDOM creates a new vgplot API context with the
  // standard coordinator and a custom namedPlots map
  return astToDOM(parseSpec(spec));
}
