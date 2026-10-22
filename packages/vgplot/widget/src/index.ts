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
import type { InitializeProps, RenderProps, AnyModel } from 'anywidget/types';
import { v4 as uuidv4 } from 'uuid';

type Params = Record<string, { value: unknown; predicate?: string }>;
type UUID = string;
interface DOM {
  element: HTMLElement | SVGSVGElement;
  params: Map<string, Param<unknown> | Selection>;
}

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
async function instantiateSpec(spec: Spec): Promise<DOM> {
  return astToDOM(parseSpec(spec));
}

function reset(): void {
  coordinator().clear();
}

/**
 * Serialize a selection's resolved predicate — a single expression or an implicitly conjunctive
 * array — to a SQL string.
 */
function predicateSQL(selection: Selection): string {
  const predicate = selection.predicate() ?? [];
  const parts = (Array.isArray(predicate) ? predicate : [predicate]).map(String);
  return parts.length > 1 ? parts.map((s) => `(${s})`).join(' AND ') : (parts[0] ?? '');
}

function updateParams(model: AnyModel<Model>, domParams: DOM['params']): void {
  let params: Params = {};

  for (const [name, param] of domParams) {
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
      model.set('params', params);
      model.save_changes();
    });
  }

  params = Object.freeze(params);
  model.set('params', params);
  model.save_changes();
}

export default {
  initialize(view: InitializeProps<Model>): void {
    view.model.set('preagg_schema', coordinator().preaggregator.schema);
  },

  // oxlint-disable-next-line max-statements
  render(view: RenderProps<Model>): () => void {
    view.el.classList.add('mosaic-widget');
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

    let appliedSpecJSON = '';

    async function updateSpec(): Promise<void> {
      const spec = view.model.get('spec');
      const specJSON = JSON.stringify(spec);
      if (specJSON === appliedSpecJSON) {
        return;
      }
      appliedSpecJSON = specJSON;
      reset();
      logger.log('Setting spec:', spec);
      const dom = await instantiateSpec(spec);
      view.el.replaceChildren(dom.element);
      updateParams(view.model, dom.params);
    }

    view.model.on('change:spec', async () => updateSpec());

    function configureCoordinator(): void {
      coordinator().preaggregator.schema = view.model.get('preagg_schema');
    }

    view.model.on('change:preagg_schema', () => configureCoordinator());

    // oxlint-disable-next-line max-statements
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
      } else if (msg.type === 'arrow') {
        const [{ buffer }] = buffers;
        logger.log('arrow bytes', buffer.byteLength);
        query.resolve(buffer);
      } else {
        query.resolve({});
      }
      logger.groupEnd();
    });

    coordinator().databaseConnector(connector);
    configureCoordinator();
    // oxlint-disable-next-line typescript/no-floating-promises
    updateSpec();

    return reset;
  },
};
