import {
  coordinator,
  isSelection,
  Connector,
  Selection,
  Param,
  ArrowQueryRequest,
  ExecQueryRequest,
} from '@uwdata/mosaic-core';
import { parseSpec, astToDOM } from '@uwdata/mosaic-spec';

import './style.css';
import type { Spec } from '@uwdata/mosaic-spec';
import type { InitializeProps, RenderProps } from 'anywidget/types';
import { v4 as uuidv4 } from 'uuid';

type Params = Record<string, { value: unknown; predicate?: string }>;

interface Model {
  spec: Spec;
  /** The current Mosaic specification. */
  preagg_schema: string;
  /** The database schema in which to store pre-aggregated materialized views (default 'mosaic'). */
  params: Params;
  /** The current params. */
}

type QueryQuery = ArrowQueryRequest | ExecQueryRequest;

type Query = {
  query: QueryQuery;
  /** The query to send. */
  startTime: number;
  resolve: (value: any) => void;
  /** The promise resolve callback. */
  reject: (reason?: any) => void;
  /** The promise reject callback. */
};

export default {
  initialize(view: InitializeProps<Model>): void {
    view.model.set('preagg_schema', coordinator().preaggregator.schema);
  },

  render(view: RenderProps<Model>): () => void {
    view.el.classList.add('mosaic-widget');
    const getSpec = () => view.model.get('spec');
    const getPreaggSchema = () => view.model.get('preagg_schema');
    const logger = coordinator().logger();

    const openQueries: Map<string, Query> = new Map();

    function send(
      query: QueryQuery,
      resolve: (value: any) => void,
      reject: (reason?: any) => void,
    ): void {
      const uuid = uuidv4();

      openQueries.set(uuid, {
        query,
        startTime: performance.now(),
        resolve,
        reject,
      });
      view.model.send({ ...query, uuid });
    }

    const connector: Connector = {
      query(query: ArrowQueryRequest | ExecQueryRequest): Promise<any> {
        return new Promise((resolve, reject) => send(query, resolve, reject));
      },
    };

    function reset(): void {
      coordinator().clear();
    }

    /**
     * Serialize a selection's resolved predicate — a single expression or an implicitly conjunctive
     * array — to a SQL string.
     */
    function predicateSQL(selection: Selection): string {
      const predicate = selection.predicate(undefined) ?? [];
      const parts = (Array.isArray(predicate) ? predicate : [predicate]).map(String);
      // oxlint-disable-next-line no-magic-numbers
      return parts.length > 1 ? parts.map((s) => `(${s})`).join(' AND ') : (parts[0] ?? '');
    }

    let appliedSpecJSON: string;

    async function updateSpec(): Promise<void> {
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
              ...(isSelection(param) ? { predicate: predicateSQL(param) } : {}),
            },
          });
          view.model.set('params', params);
          view.model.save_changes();
        });
      }

      params = Object.freeze(params);
      view.model.set('params', params);
      view.model.save_changes();
    }

    view.model.on('change:spec', () => updateSpec());

    function configureCoordinator(): void {
      coordinator().preaggregator.schema = getPreaggSchema();
    }

    view.model.on('change:preagg_schema', () => configureCoordinator());

    view.model.on('msg:custom', (msg, buffers) => {
      logger.group(`query ${msg.uuid}`);
      logger.log('received message', msg, buffers);

      const query = openQueries.get(msg.uuid)!;
      openQueries.delete(msg.uuid);

      // oxlint-disable-next-line no-magic-numbers
      logger.log(query.query.sql, (performance.now() - query.startTime).toFixed(1));

      if (msg.error) {
        query.reject(msg.error);
        logger.error(msg.error);
      } else {
        switch (msg.type) {
          case 'arrow': {
            // oxlint-disable-next-line no-magic-numbers
            logger.log('arrow bytes', buffers[0].buffer.byteLength);
            // oxlint-disable-next-line no-magic-numbers
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
    // oxlint-disable-next-line typescript/no-floating-promises
    updateSpec();

    return (): void => {
      // cleanup
      reset();
    };
  },
};

/**
 * Parse specification, and instantiate it astToDOM creates a new vgplot API context with the
 * standard coordinator and a custom namedPlots map.
 */
function instantiateSpec(
  spec: Spec,
): Promise<{ element: HTMLElement | SVGSVGElement; params: Map<string, Param<any> | Selection> }> {
  return astToDOM(parseSpec(spec));
}
