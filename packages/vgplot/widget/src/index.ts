import type {
  Connector,
  Selection,
  Param,
  ArrowQueryRequest,
  ExecQueryRequest,
  Logger,
} from '@uwdata/mosaic-core';
import { coordinator, isSelection } from '@uwdata/mosaic-core';
import { parseSpec, astToDOM } from '@uwdata/mosaic-spec';

import './style.css';
import type { Spec } from '@uwdata/mosaic-spec';
import type { InitializeProps, RenderProps, AnyModel, AnyWidget } from 'anywidget/types';
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
interface Msg {
  uuid: UUID;
  type: OpenQuery['query']['type'];
  error?: string;
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
 *
 * TODO @dangotbanned: Request this to be taken care of in core/sql
 */
function predicateSQL(selection: Selection): string {
  const predicate = selection.predicate() ?? [];
  const parts = (Array.isArray(predicate) ? predicate : [predicate]).map(String);
  return parts.length > 1 ? parts.map((s) => `(${s})`).join(' AND ') : (parts[0] ?? '');
}

/** TODO @dangotbanned: Use classes instead of deep freezing? */
function updateParams(model: AnyModel<Model>, domParams: DOM['params']): void {
  let params: Params = {};
  for (const [name, param] of domParams) {
    if (isSelection(param)) {
      params[name] = { value: param.value, predicate: predicateSQL(param) };
      param.addEventListener('value', (value) => {
        params = Object.freeze({ ...params, [name]: { value, predicate: predicateSQL(param) } });
        model.set('params', params);
        model.save_changes();
      });
    } else {
      params[name] = { value: param.value };
      param.addEventListener('value', (value) => {
        params = Object.freeze({ ...params, [name]: { value } });
        model.set('params', params);
        model.save_changes();
      });
    }
  }

  params = Object.freeze(params);
  model.set('params', params);
  model.save_changes();
}

class WidgetConnector implements Connector {
  private readonly logger: Logger;
  private readonly openQueries: Map<UUID, OpenQuery>;
  private readonly model: AnyModel<Model>;

  public constructor(model: AnyModel<Model>) {
    this.logger = coordinator().logger();
    this.openQueries = new Map<UUID, OpenQuery>();
    this.model = model;
  }

  public async query(query: ArrowQueryRequest): Promise<Uint8Array>;
  public async query(query: ExecQueryRequest): Promise<void>;
  public async query(query: OpenQuery['query']): Promise<unknown> {
    // 2 of these, with different queries are getting fired per param change
    // 1 looks like the sql expr, the other is some super complex CTE
    this.logger.log('issuing query:', query.sql);
    return new Promise((resolve, reject) => this.send({ query, resolve, reject }));
  }

  private send({ query, resolve, reject }: Omit<OpenQuery, 'startTime'>): void {
    const uuid: UUID = uuidv4();
    this.openQueries.set(uuid, {
      query,
      startTime: performance.now(),
      resolve,
      reject,
    });
    this.model.send({ ...query, uuid });
  }

  public receive(msg: Msg, buffers: DataView[]): void {
    const { uuid } = msg;
    this.logger.group(`received message: ${uuid}`);
    // oxlint-disable-next-line typescript/no-non-null-assertion
    const query = this.openQueries.get(msg.uuid)!;
    this.openQueries.delete(msg.uuid);
    const elapsed = (performance.now() - query.startTime).toFixed(1);
    this.logger.log('took', elapsed, 'ms');

    if (msg.error) {
      query.reject(msg.error);
      this.logger.error(msg.error);
      this.logger.groupEnd();
      throw new Error(msg.error);
    }

    if (msg.type === 'arrow') {
      const [{ buffer }] = buffers;
      this.logger.log('arrow bytes:', buffer.byteLength);
      query.resolve(buffer);
    } else {
      query.resolve({});
    }
    this.logger.groupEnd();
  }
}

// oxlint-disable-next-line unicorn/no-anonymous-default-export
export default (): AnyWidget<Model> => {
  const coord = coordinator();
  return {
    initialize({ model }: InitializeProps<Model>): () => void {
      model.set('preagg_schema', coord.preaggregator.schema);
      model.on('change:preagg_schema', () => {
        coord.preaggregator.schema = model.get('preagg_schema');
      });
      const connector = new WidgetConnector(model);
      model.on('msg:custom', connector.receive.bind(connector));
      coord.databaseConnector(connector);
      return coord.clear.bind(coord);
    },

    async render({ model, el }: RenderProps<Model>): Promise<() => void> {
      el.classList.add('mosaic-widget');

      const logger = coord.logger();
      logger.group('render');

      let appliedSpecJSON = '';

      async function updateSpec(): Promise<void> {
        logger.log('inside updateSpec');
        const spec = model.get('spec');
        const specJSON = JSON.stringify(spec);
        if (specJSON === appliedSpecJSON) {
          logger.log('spec json eq');
          return;
        }
        logger.log('spec json diff');
        appliedSpecJSON = specJSON;
        reset();
        const dom = await instantiateSpec(spec);
        el.replaceChildren(dom.element);
        updateParams(model, dom.params);
      }

      model.on('change:spec', updateSpec);
      logger.log('calling updateSpec manually');
      /* This call seems to be very expensive

      - Why is the full spec converted into a string?
      - Why is the full spec also being re-parsed and transformed?
      - Is there anything besides `params` that is expected to change?
      - Why are we detecting changes from within a callback for "Listen for property changes..."?
      
      */
      await updateSpec();
      logger.log('finished manual updateSpec');
      logger.groupEnd();
      return reset;
    },
  };
};
