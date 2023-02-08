import * as arrow from "apache-arrow";
import { coordinator, parseJSON, Coordinator } from "@uwdata/vgplot";
import "./style.css";

let queryCounter = 0;

export async function render(view) {
  const spec = view.model.get("spec");

  console.log("Initialize client with spec:", spec);

  view.el.classList.add("mosaic-widget");

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

  view.model.on("msg:custom", (msg, buffers) => {
    console.group(`query ${msg.queryId}`);
    console.log("received message", msg, buffers);

    const query = openQueries[msg.queryId];
    delete openQueries[msg.queryId];

    console.log("resolving query", query.query.sql);

    switch (msg.type) {
      case "arrow": {
        const table = arrow.tableFromIPC(buffers[0].buffer);
        console.log("table", table);
        query.resolve(table);
        break;
      }
      case "json": {
        console.log("json", msg.result);
        query.resolve(msg.result);
        break;
      }
      default: {
        query.resolve({});
        break;
      }
    }
    console.groupEnd("query");
  });

  coordinator().databaseClient(client);
  view.el.replaceChildren(await parseJSON(spec));
}
