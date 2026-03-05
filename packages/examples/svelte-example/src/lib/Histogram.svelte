<script>
  // A more elaborate client that displays a ASCII histogram.

  import { makeClient } from "@uwdata/mosaic-core";
  import { count, dateMonth, desc, Query, eq } from "@uwdata/mosaic-sql";

  const { coordinator, table, selection } = $props();

  const MONTH_NAMES = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(
    ","
  );

  let values = $state(null);
  let isPending = $state(false);
  let selectedMonth = $state(null);

  $effect(() => {
    const tableName = table;

    const client = makeClient({
      coordinator,
      selection,
      query: (predicate) => {
        return Query.from(tableName)
          .select({ month: dateMonth("date"), count: count() })
          .groupby(dateMonth("date"))
          .orderby(desc("count"))
          .where(predicate);
      },
      queryResult: (data) => {
        values = Array.from(data);
      },
      queryPending: () => {
        isPending = true;
      },
      queryError: () => {
        isPending = false;
      },
    });

    selectedMonth = null;

    // Update the selection with the currently selected item.
    $effect(() => {
      selection.update({
        source: client,
        value: selectedMonth,
        clients: new Set([client]),
        predicate:
          selectedMonth != null ? eq(dateMonth("date"), selectedMonth) : null,
      });
    });

    return () => {
      // Clear the selection before destroying the client.
      selection.update({
        source: client,
        value: null,
        predicate: null,
      });

      // Destroy the client on effect cleanup.
      client.destroy();
    };
  });
</script>

{#if values}
  {#each values as { month, count }}
    {@const isSelected = selectedMonth?.getTime() == month?.getTime()}
    <button
      onclick={() => {
        if (isSelected) {
          selectedMonth = null;
        } else {
          selectedMonth = month;
        }
      }}
      style:background={isSelected ? "#ccc" : "#fff"}
    >
      {MONTH_NAMES[month.getUTCMonth()]}: {"=".repeat(Math.ceil(count / 5))} ({count})
    </button>
  {/each}
{/if}

<style>
  button {
    display: block;
    padding: 0;
    margin: 0;
    border: none;
    background: none;
    font-family: monospace;
    padding: 2px 0;
  }
</style>
