import { describe, it, expect } from "vitest";
import { clausePoint, Selection } from "../src/index.js";

describe("Selection", () => {
  it("can be reset", () => {
    const selection = new Selection();
    const clause = clausePoint("column", 5, { source: {} });
    selection.update(clause);

    expect(selection.clauses[0]).toEqual(clause);
    expect(selection.clauses).toHaveLength(1);
    selection.reset();
    expect(selection.clauses).toEqual([]);
  });

  it("relays reset downstream ", () => {
    const selectionA = new Selection();
    const selectionB = new Selection();
    const upstreamSelection = Selection.crossfilter({
      include: [selectionA, selectionB],
    });

    const clauseA = clausePoint("a", 1, { source: {} });
    const clauseB = clausePoint("b", 2, { source: {} });

    selectionA.update(clauseA);
    selectionB.update(clauseB);

    expect(upstreamSelection.clauses).toHaveLength(2);
    expect(upstreamSelection.clauses).toContain(clauseA);
    expect(upstreamSelection.clauses).toContain(clauseB);

    selectionB.reset();
    expect(upstreamSelection.clauses).toHaveLength(1);
    expect(upstreamSelection.clauses).toContain(clauseA);

    selectionA.reset();
    expect(upstreamSelection.clauses).toHaveLength(0);
  });

  it("can specify a clause to reset", () => {
    const selectionA = new Selection();
    const selectionB = new Selection();
    const upstreamSelection = Selection.crossfilter({
      include: [selectionA, selectionB],
    });

    const clauseA = clausePoint("a", 1, { source: {} });
    const clauseB = clausePoint("b", 2, { source: {} });

    selectionA.update(clauseA);
    selectionB.update(clauseB);

    expect(upstreamSelection.clauses).toHaveLength(2);
    expect(upstreamSelection.clauses).toContain(clauseA);
    expect(upstreamSelection.clauses).toContain(clauseB);

    upstreamSelection.reset([clauseB]);
    expect(upstreamSelection.clauses).toHaveLength(1);
    expect(upstreamSelection.clauses).toContain(clauseA);

  });
});
