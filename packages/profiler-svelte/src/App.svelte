<script>
    import { onMount } from 'svelte';
    import { coordinator, wasmConnector } from '@uwdata/mosaic-core';
    import * as vg from '@uwdata/vgplot';
    import ColumnProfile from './ColumnProfile.svelte';

    let columnNames = [];
    let columnTypes = [];

    let connector;
    let db;

	let key = 0; 

	let brush;
	
    async function initializeDatabase() {
        connector = wasmConnector();
        db = await connector.getDuckDB();
        coordinator().databaseConnector(connector);
    }

	async function handleFileInput(event) {
        const file = event.target.files[0];
        if (file) {
			if (file.type === 'text/csv') {
            	loadCSVToDuckDB(file);
			// } else if (file.type === 'application/x-parquet') {
			// 	loadParquetToDuckDB(file);
			}
        }
    }

    function loadCSVToDuckDB(csvFile) {
        if (csvFile) {
            var reader = new FileReader();
            reader.readAsText(csvFile, "UTF-8");
            reader.onload = async function (evt) {
                db.registerFileText(csvFile.name, evt.target.result);
                await coordinator().exec([
                    vg.loadCSV("dataprof", csvFile.name, { replace: true })
                ]);
                console.log(csvFile.name + " loaded");
                await getInfo();
            }
        }
    }

    async function getInfo() {
        const col = await coordinator().query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'dataprof'
        `, { cache: false });

        const type = await coordinator().query(`
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = 'dataprof'
        `, { cache: false });

        columnNames = Array.from(col).map(row => row.column_name);
        columnTypes = Array.from(type).map(row => row.data_type);

        console.log(columnNames);
        console.log(columnTypes);

		key += 1;
		brush = vg.Selection.crossfilter();
    }

    onMount(async () => {
        await initializeDatabase();
        document.getElementById('csvFileInput').addEventListener('input', handleFileInput);
    });
</script>

<div>
    <input type="file" id="csvFileInput" accept=".csv"/>

	{#key key}
    {#if columnNames.length > 0 && brush}
        {#each columnNames as column, index}
            <ColumnProfile
                colName={column}
                type={columnTypes[index]}
				brush={brush}
			/>
        {/each}
    {:else if columnNames === undefined} <!-- Show loading state -->
        <p>Loading...</p>
    {:else} <!-- Handle empty case -->
        <p class="pl-8">No columns!</p>
    {/if}
	{/key}
</div>
