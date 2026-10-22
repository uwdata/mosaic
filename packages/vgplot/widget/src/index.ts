import type {
  Connector,
  Selection,
  Param,
  ArrowQueryRequest,
  ExecQueryRequest,
} from '@uwdata/mosaic-core';
import { coordinator, isSelection } from '@uwdata/mosaic-core';
import { parseSpec, astToDOM } from '@uwdata/mosaic-spec';

import './style.css';
import type { Spec } from '@uwdata/mosaic-spec';
import type { InitializeProps, RenderProps } from 'anywidget/types';
import { v4 as uuidv4 } from 'uuid';

type Params = Record<string, { value: unknown; predicate?: string }>;
type UUID = string;

interface Model {
  spec: Spec;
  /** The current Mosaic specification. */
  preagg_schema: string;
  /** The database schema in which to store pre-aggregated materialized views (default 'mosaic'). */
  params: Params;
  /** The current params. */
}

interface OpenQuery {
  query: ArrowQueryRequest | ExecQueryRequest;
  startTime: number;
  resolve: (value: ArrayBufferLike | Record<string, unknown>) => void;
  reject: (reason?: string) => void;
}

/**
 * Parse specification, and instantiate it astToDOM creates a new vgplot API context with the
 * standard coordinator and a custom namedPlots map.
 */
async function instantiateSpec(spec: Spec): Promise<{
  element: HTMLElement | SVGSVGElement;
  params: Map<string, Param<unknown> | Selection>;
}> {
  return astToDOM(parseSpec(spec));
}

export default {
  initialize(view: InitializeProps<Model>): void {
    view.model.set('preagg_schema', coordinator().preaggregator.schema);
  },

  render(view: RenderProps<Model>): () => void {
    view.el.classList.add('mosaic-widget');
    function getSpec(): Spec {
      return view.model.get('spec');
    }
    function getPreaggSchema(): string {
      return view.model.get('preagg_schema');
    }
    const logger = coordinator().logger();

    const openQueries = new Map<UUID, OpenQuery>();

    function send(
      query: OpenQuery['query'],
      resolve: OpenQuery['resolve'],
      reject: OpenQuery['reject'],
    ): void {
      const uuid: UUID = uuidv4();

      openQueries.set(uuid, {
        query,
        startTime: performance.now(),
        resolve,
        reject,
      });
      view.model.send({ ...query, uuid });
    }

    const connector: Connector = {
      // The overloads for `Connector` can't be satisfied
      // oxlint-disable-next-line typescript/no-explicit-any
      async query(query: OpenQuery['query']): Promise<any> {
        return new Promise((resolve, reject) => send(query, resolve, reject));
      },
    };

    // oxlint-disable-next-line unicorn/consistent-function-scoping
    function reset(): void {
      coordinator().clear();
    }

    /**
     * Serialize a selection's resolved predicate — a single expression or an implicitly conjunctive
     * array — to a SQL string.
     */
    // oxlint-disable-next-line unicorn/consistent-function-scoping
    function predicateSQL(selection: Selection): string {
      // oxlint-disable-next-line no-undefined
      const predicate = selection.predicate(undefined) ?? [];
      const parts = (Array.isArray(predicate) ? predicate : [predicate]).map(String);
      // oxlint-disable-next-line no-magic-numbers
      return parts.length > 1 ? parts.map((s) => `(${s})`).join(' AND ') : (parts[0] ?? '');
    }

    let appliedSpecJSON = '';
    // oxlint-disable max-statements
    async function updateSpec(): Promise<void> {
      const spec = getSpec();
      const specJSON = JSON.stringify(spec);
      if (specJSON === appliedSpecJSON) {
        return;
      }
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
    // oxlint-enable max-statements

    view.model.on('change:spec', async () => updateSpec());

    function configureCoordinator(): void {
      coordinator().preaggregator.schema = getPreaggSchema();
    }

    view.model.on('change:preagg_schema', () => configureCoordinator());

    // oxlint-disable max-statements
    view.model.on('msg:custom', (msg, buffers) => {
      logger.group(`query ${msg.uuid}`);
      logger.log('received message', msg, buffers);

      // oxlint-disable-next-line typescript/no-non-null-assertion
      const query = openQueries.get(msg.uuid)!;
      openQueries.delete(msg.uuid);

      logger.log(query.query.sql, (performance.now() - query.startTime).toFixed(1));

      if (msg.error) {
        query.reject(msg.error);
        logger.error(msg.error);
      } else {
        switch (msg.type) {
          case 'arrow': {
            const [{ buffer }] = buffers;
            logger.log('arrow bytes', buffer.byteLength);
            query.resolve(buffer);
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
    // oxlint-enable max-statements

    coordinator().databaseConnector(connector);
    configureCoordinator();
    // oxlint-disable-next-line typescript/no-floating-promises
    updateSpec();

    return (): void => {
      // Cleanup
      reset();
    };
  },
};
