import { Query } from "@uwdata/mosaic-sql";
import { describe, expect, it } from "vitest";
import { Coordinator, makeClient } from "../src/index.js";
import { NodeConnector } from "./util/node-connector.js";

describe("makeClient", () => {
  it("should create a connected client and destroy it", async () => {
    const mc = new Coordinator(await NodeConnector.make(), {
      logger: null,
    });

    await mc.exec(
      `CREATE TABLE foo AS (
        SELECT 1
      )`
    );

    const client = makeClient({
      query: () => {
        return Query.from("foo").select("*");
      },
      coordinator: mc,
    });

    expect(mc.clients).toContain(client);

    // await pending queries before destroying the client
    await client.pending;

    client.destroy();
    expect(mc.clients).not.toContain(client);
  });
});
