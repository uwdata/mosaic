import { coordinator, namedPlots, parseJSON } from '@uwdata/vgplot';
import * as arrow from 'apache-arrow';
import './style.css';

let queryCounter = 0;

/** @param view {import("@jupyter-widgets/base").DOMWidgetView} */
export async function render(view) {
  view.el.classList.add('mosaic-widget');

  const getSpec = () => view.model.get('spec');

  const logger = coordinator().logger();

  const openQueries = new Map();

  function send(query, resolve, reject) {
    const queryId = queryCounter++;

    openQueries.set(queryId, { query, startTime: performance.now(), resolve, reject });
    view.model.send({ ...query, queryId });
  }

  const client = {
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
    view.el.replaceChildren(await parseJSON(spec));

    // Update the selections traitlet
    const c = coordinator();
    const selections = new Set([...c.clients].flatMap(c => c.filterBy).filter(s => s))
    for (const s of selections) {
      s.addEventListener('value', () => {
        const s = [...selections].map(
          s => s.clauses.map(
            c => ({
              predicate: c.predicate,
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
    logger.group(`query ${msg.queryId}`);
    logger.log('received message', msg, buffers);

    const query = openQueries.get(msg.queryId);
    openQueries.delete(msg.queryId);

    logger.log(query.query.sql, Math.round(performance.now() - query.startTime));

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

  coordinator().databaseClient(client);
  updateSpec();
}
