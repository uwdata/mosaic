import * as arrow from 'apache-arrow';
import { coordinator, parseJSON } from '@uwdata/vgplot';
import './style.css';

let queryCounter = 0;

export async function render(view) {
  view.el.classList.add('mosaic-widget');

  const getSpec = () => view.model.get('spec');

  const openQueries = {};

  function send(query, resolve, reject) {
    const queryId = queryCounter++;

    openQueries[queryId] = { query, resolve, reject };
    view.model.send({ ...query, queryId });
  }

  const client = {
    query(query) {
      return new Promise((resolve, reject) => send(query, resolve, reject));
    },
  };

  async function updateSpec() {
    const spec = getSpec();
    console.log('Setting spec:', spec);
    view.el.replaceChildren(await parseJSON(spec));
  }

  view.model.on('change:spec', () => updateSpec());

  view.model.on('msg:custom', (msg, buffers) => {
    console.group(`query ${msg.queryId}`);
    console.log('received message', msg, buffers);

    const query = openQueries[msg.queryId];
    delete openQueries[msg.queryId];

    console.log('resolving query', query.query.sql);

    switch (msg.type) {
      case 'arrow': {
        const table = arrow.tableFromIPC(buffers[0].buffer);
        console.log('table', table);
        query.resolve(table);
        break;
      }
      case 'json': {
        console.log('json', msg.result);
        query.resolve(msg.result);
        break;
      }
      default: {
        query.resolve({});
        break;
      }
    }
    console.groupEnd('query');
  });

  coordinator().databaseClient(client);
  updateSpec();
}
