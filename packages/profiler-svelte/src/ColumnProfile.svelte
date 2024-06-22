<script>
    import MyComponent from './ColumnEntry.svelte';
	import { onMount, onDestroy } from 'svelte';
    import { coordinator } from '@uwdata/mosaic-core';
	import * as vg from '@uwdata/vgplot';
    import { v4 as uuidv4 } from 'uuid';

    export let colName;
    export let type;
    export let brush;
    var uniqueId = `plot-${uuidv4()}`;

    async function getPlot() {
        if (type == 'DOUBLE' || type == 'BIGINT') {
            document.querySelector(`#${uniqueId}`).replaceChildren(vg.vconcat(vg.plot(
                vg.rectY(
                    vg.from("dataprof", { filterBy: brush }),
                    { x: vg.bin(colName), y: vg.count(), fill: "steelblue", inset: 0.5 }
                ),
                vg.intervalX({ as: brush }),
                vg.xDomain(vg.Fixed),
                vg.yTickFormat("s"),
                vg.width(500),
                vg.height(80)
            )));
        } else if (type == 'DATE') {
            const countOfEachDate = await coordinator().query(`
                SELECT ${colName}, COUNT(*) AS count
                FROM dataprof
                GROUP BY ${colName}
            `, { cache: false });

            const counts = Array.from(countOfEachDate).map(row => row.count);
            console.log(colName);
            console.log(counts);

            document.querySelector(`#${uniqueId}`).replaceChildren(vg.vconcat(vg.plot(
                vg.areaY(
                    vg.from("dataprof", { filterBy: brush }),
                    { x: colName, y: counts, fill: "steelblue", inset: 0.5 }
                ),
                vg.intervalX({ as: brush }),
                vg.width(500),
                vg.height(80),
            )));
        } else if (type == 'VARCHAR'){
            const countOfEachCategory = await coordinator().query(`
                SELECT ${colName}, COUNT(*) AS frequency
                FROM dataprof
                WHERE ${colName} IS NOT NULL
                GROUP BY ${colName}
                ORDER BY frequency DESC
                LIMIT 2;
            `, { cache: false });

            const counts = Array.from(countOfEachCategory).map(row => row.frequency);

            document.querySelector(`#${uniqueId}`).replaceChildren(vg.vconcat(vg.plot(
                vg.barY(
                    vg.from("dataprof"),
                    { x: colName, y: counts, fill: "steelblue", inset: 0.5, sort: {x: "-y", limit: 2}}
                ),
                vg.width(500),
                vg.height(80),
            )));
        }
    }

    onMount(async () => {
        await getPlot();
    });
</script>

<MyComponent>
    <svelte:fragment slot="right">
        <div id="{uniqueId}"></div>
    </svelte:fragment>

	<svelte:fragment slot="left">
		<span>{colName}</span>
	</svelte:fragment>
</MyComponent>


