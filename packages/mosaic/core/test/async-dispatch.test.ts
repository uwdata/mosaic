import { describe, expect, it } from "vitest";
import { AsyncDispatch } from "../src/util/AsyncDispatch.js";

class FilteredDispatch extends AsyncDispatch<number> {
  override emitQueueFilter(): (value: number) => boolean {
    return (value: number) => value % 2 === 0;
  }
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = (): void => {};
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("AsyncDispatch", () => {
  it("emits to listeners added after an initial listener-less emit", () => {
    const dispatch = new AsyncDispatch<number>();
    const values: number[] = [];

    dispatch.emit("value", 1);
    dispatch.addEventListener("value", (value) => {
      values.push(value);
    });
    dispatch.emit("value", 2);

    expect(values).toEqual([2]);
  });

  it("deduplicates and removes listeners", () => {
    const dispatch = new AsyncDispatch<number>();
    const values: number[] = [];
    const listener = (value: number): void => {
      values.push(value);
    };

    dispatch.addEventListener("value", listener);
    dispatch.addEventListener("value", listener);
    dispatch.emit("value", 1);

    dispatch.removeEventListener("value", listener);
    dispatch.emit("value", 2);

    expect(values).toEqual([1]);
  });

  it("replaces queued values by default while an emit is pending", async () => {
    const dispatch = new AsyncDispatch<number>();
    const values: number[] = [];
    const gate = deferred();
    let block = true;

    dispatch.addEventListener("value", async (value) => {
      values.push(value);
      if (block) {
        block = false;
        await gate.promise;
      }
    });

    dispatch.emit("value", 1);
    dispatch.emit("value", 2);
    dispatch.emit("value", 3);

    expect(values).toEqual([1]);

    gate.resolve();
    await dispatch.pending("value");
    await dispatch.pending("value");

    expect(values).toEqual([1, 3]);
  });

  it("filters queued values using emitQueueFilter", async () => {
    const dispatch = new FilteredDispatch();
    const values: number[] = [];
    const gate = deferred();
    let block = true;

    dispatch.addEventListener("value", async (value) => {
      values.push(value);
      if (block) {
        block = false;
        await gate.promise;
      }
    });

    dispatch.emit("value", 1);
    dispatch.emit("value", 2);
    dispatch.emit("value", 3);
    dispatch.emit("value", 4);

    gate.resolve();
    await dispatch.pending("value");
    await dispatch.pending("value");

    expect(values).toEqual([1, 2, 4]);
  });

  it("cancels queued values without interrupting a pending emit", async () => {
    const dispatch = new AsyncDispatch<number>();
    const values: number[] = [];
    const gate = deferred();
    let block = true;

    dispatch.addEventListener("value", async (value) => {
      values.push(value);
      if (block) {
        block = false;
        await gate.promise;
      }
    });

    dispatch.emit("value", 1);
    dispatch.emit("value", 2);
    dispatch.cancel("value");

    gate.resolve();
    await dispatch.pending("value");

    expect(values).toEqual([1]);
  });
});
