# Clients for Web Frameworks

[Clients](/core/#clients) are responsible for publishing their data needs and performing data processing tasks&mdash;such as rendering a visualization.
The [`MosaicClient` class](/api/core/client.html) provides a base class for client implementation.

Many applications are written in web frameworks such as [React](https://react.dev), [Svelte](https://svelte.dev), and [Vue](https://vuejs.org).
These frameworks have their own state management and lifecycle management systems which make it difficult to use the `MosaicClient` class directly.
Mosaic has a `makeClient` API that makes it easier to integrate with such frameworks.

## Svelte Example

Here is an example `Count` component written in Svelte, with `$effect`:

```svelte
<script>
  // Show the number of rows in the table.
  // If a `selection` is provided, show the filtered number of rows as well.

  import { makeClient } from "@uwdata/mosaic-core";
  import { count, Query } from "@uwdata/mosaic-sql";

  const { coordinator, table, selection } = $props();

  let totalCount = $state(null);
  let filteredCount = $state(null);
  let isError = $state(false);
  let isPending = $state(false);

  $effect(() => {
    // Capture tableName so Svelte keeps track of it in the effect.
    // When `table` changes, Svelte will re-run the effect and cause the old client
    // be destroyed and a new client be created.
    let tableName = table;

    // Note that the identity of `selection` is also captured below.
    // If it is replaced with a new instance of Selection, the client will get recreated as well.

    let client = makeClient({
      coordinator,
      selection,
      prepare: async () => {
        // Preparation work before the client starts.
        // Here we get the total number of rows in the table.
        let result = await coordinator.query(
          Query.from(tableName).select({ count: count() })
        );
        totalCount = result.get(0).count;
      },
      query: (predicate) => {
        // Returns a query to retrieve the data.
        // The `predicate` is the selection's predicate for this client.
        // Here we use it to get the filtered count.
        return Query.from(tableName)
          .select({ count: count() })
          .where(predicate);
      },
      queryResult: (data) => {
        // The query result is available.
        filteredCount = data.get(0).count;
        isError = false;
        isPending = false;
      },
      queryPending: () => {
        // The query is pending.
        isPending = true;
        isError = false;
      },
      queryError: () => {
        // There is an error running the query.
        isPending = false;
        isError = true;
      },
    });

    return () => {
      // Destroy the client on effect cleanup.
      client.destroy();
    };
  });
</script>

{filteredCount} / {totalCount}
{isPending ? "(pending)" : ""}
{isError ? "(error)" : ""}
```

The `makeClient` API combined with `$effect` allows the component to update its client when the props changes. This includes:
- Replacement of the `coordinator` instance.
- Changes to the `table` name.
- Replacement of the `selection` instance (i.e., when the `selection` is replaced with a new instance of `Selection`).

## React Example

Here is the same example in React:

```jsx
import { makeClient } from "@uwdata/mosaic-core";
import { count, Query } from "@uwdata/mosaic-sql";
import { useState, useEffect } from "react";

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
          Query.from(tableName).select({ count: count() })
        );
        setTotalCount(result.get(0).count);
      },
      query: (predicate) => {
        // Returns a query to retrieve the data.
        // The `predicate` is the selection's predicate for this client.
        // Here we use it to get the filtered count.
        return Query.from(tableName)
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
```