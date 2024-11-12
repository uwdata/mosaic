<script>
  // Show the number of rows in the table.
  // If a `selection` is provided, show the filtered number of rows as well.

  import { makeClient } from "@uwdata/mosaic-core";
  import { count, Query } from "@uwdata/mosaic-sql";

  let { coordinator, table, selection } = $props();

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
