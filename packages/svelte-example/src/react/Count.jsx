import { makeClient } from "@uwdata/mosaic-core";
import { count, Query } from "@uwdata/mosaic-sql";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

/** Show the number of rows in the table.
 * If a `selection` is provided, show the filtered number of rows as well. */
export function Count(props) {
  const { coordinator, table, selection } = props;

  const [totalCount, setTotalCount] = useState(null);
  const [filteredCount, setFilteredCount] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Note that the identity of `table` and `selection` is captured below.
    // If they are replaced with a new instances, the client will get recreated as well.

    const client = makeClient({
      coordinator,
      selection,
      prepare: async () => {
        // Preparation work before the client starts.
        // Here we get the total number of rows in the table.
        const result = await coordinator.query(
          Query.from(table).select({ count: count() })
        );
        setTotalCount(result.get(0).count);
      },
      query: (predicate) => {
        // Returns a query to retrieve the data.
        // The `predicate` is the selection's predicate for this client.
        // Here we use it to get the filtered count.
        return Query.from(table)
          .select({ count: count() })
          .where(predicate);
      },
      queryResult: (data) => {
        // The query result is available.
        setFilteredCount(data.get(0).count);
        setIsError(false);
        setIsPending(false);
      },
      queryPending: () => {
        // The query is pending.
        setIsPending(true);
        setIsError(false);
      },
      queryError: () => {
        // There is an error running the query.
        setIsPending(false);
        setIsError(true);
      },
    });

    return () => {
      // Destroy the client on effect cleanup.
      client.destroy();
    };
  }, [coordinator, table, selection]);

  return (
    <div>
      {filteredCount} / {totalCount}
      {isPending ? "(pending)" : ""}
      {isError ? "(error)" : ""}
    </div>
  );
}

export function bridgeCount(element, props) {
  const root = createRoot(element);
  root.render(<Count {...props} />);
  return {
    update(props) {
      root.render(<Count {...props} />);
    },
    destroy() {
      root.destroy();
    },
  };
}
