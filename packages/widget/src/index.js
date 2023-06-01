import { coordinator, namedPlots, parseSpec } from '@uwdata/vgplot';
import * as arrow from 'apache-arrow';
import './style.css';

/**
 * @typedef Model
 * @prop {Record<any, unknown>} spec - the current specification
 * @prop {Array} selections - the current selections
 */

/** @type {import("anywidget/types").Render<Model>} */
export async function render(view) {
  view.el.classList.add('mosaic-widget');

  const getSpec = () => view.model.get('spec');

  const logger = coordinator().logger();

  /** @type Map<string, {query: Record<any, unknown>, startTime: number, resolve: (value: any) => void, reject: (reason?: any) => void}> */
  const openQueries = new Map();

  /**
   * @param {Record<any, unknown>} query - the query to send
   * @param {(value: any) => void} resolve - the promise resolve callback
   * @param {(reason?: any) => void} reject - the promise reject callback
   */
  function send(query, resolve, reject) {
    const uuid = globalThis.crypto.randomUUID();

    openQueries.set(uuid, { query, startTime: performance.now(), resolve, reject });
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
    view.el.replaceChildren(await parseSpec(spec));

    // Update the selections traitlet
    const c = coordinator();
    const selections = new Set([...c.clients].flatMap(c => c.filterBy).filter(s => s))
    for (const s of selections) {
      s.addEventListener('value', () => {
        const s = [...selections].map(
          s => s.clauses.map(
            c => ({
              value: c.value,
              sql: String(c.predicate)
            })
          )
        );
        view.model.set('selections', s);
        view.model.save_changes();
      });
    }
  }

  view.model.on('change:spec', () => updateSpec());

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
  updateSpec();

  return () => {
    // cleanup
    reset();
  };
}
