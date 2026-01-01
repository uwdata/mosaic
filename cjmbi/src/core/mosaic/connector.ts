import { coordinator, wasmConnector } from '@uwdata/vgplot';
import type { DataSourceType, TableInfo, ColumnInfo } from '@/types';

export interface MosaicConnectorOptions {
  type: DataSourceType;
  url?: string;
  port?: number;
}

class MosaicConnectorService {
  private initialized = false;
  private connectorType: DataSourceType = 'wasm';
  private connector: ReturnType<typeof wasmConnector> | null = null;

  async initialize(options: MosaicConnectorOptions = { type: 'wasm' }): Promise<void> {
    if (this.initialized) {
      return;
    }

    const mc = coordinator();
    
    switch (options.type) {
      case 'wasm':
        this.connector = wasmConnector();
        mc.databaseConnector(this.connector);
        break;
      case 'socket':
        console.warn('Socket connector not yet implemented, falling back to WASM');
        this.connector = wasmConnector();
        mc.databaseConnector(this.connector);
        break;
      case 'rest':
        console.warn('REST connector not yet implemented, falling back to WASM');
        this.connector = wasmConnector();
        mc.databaseConnector(this.connector);
        break;
      default:
        this.connector = wasmConnector();
        mc.databaseConnector(this.connector);
    }

    this.connectorType = options.type;
    this.initialized = true;
  }

  async exec(query: string): Promise<void> {
    await this.ensureInitialized();
    const mc = coordinator();
    await mc.exec(query);
  }

  async query<T = unknown>(sql: string): Promise<T[]> {
    await this.ensureInitialized();
    const mc = coordinator();
    const result = await mc.query(sql, { type: 'json' });
    return result as T[];
  }

  async loadCSVFromText(tableName: string, csvText: string): Promise<void> {
    await this.ensureInitialized();
    // Parse CSV and create table
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have header and at least one row');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return values;
    });

    // Create table with inferred types
    const sampleRow = rows[0];
    const columnDefs = headers.map((h, i) => {
      const val = sampleRow[i];
      let type = 'VARCHAR';
      if (!isNaN(Number(val)) && val !== '') {
        type = val.includes('.') ? 'DOUBLE' : 'INTEGER';
      }
      return `"${h}" ${type}`;
    }).join(', ');

    await this.exec(`DROP TABLE IF EXISTS "${tableName}"`);
    await this.exec(`CREATE TABLE "${tableName}" (${columnDefs})`);

    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch.map(row => {
        const vals = row.map((v, idx) => {
          const header = headers[idx];
          const colDef = columnDefs.split(',')[idx];
          if (colDef?.includes('INTEGER') || colDef?.includes('DOUBLE')) {
            return v === '' ? 'NULL' : v;
          }
          return `'${v.replace(/'/g, "''")}'`;
        }).join(', ');
        return `(${vals})`;
      }).join(', ');
      
      await this.exec(`INSERT INTO "${tableName}" VALUES ${values}`);
    }
  }

  async loadCSV(tableName: string, url: string): Promise<void> {
    await this.ensureInitialized();
    
    // For blob URLs (local files), use DuckDB's read_csv
    if (url.startsWith('blob:')) {
      const query = `CREATE TABLE IF NOT EXISTS "${tableName}" AS SELECT * FROM read_csv('${url}', auto_detect=true, sample_size=-1)`;
      await this.exec(query);
      return;
    }
    
    // For remote URLs, fetch and parse manually
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      await this.loadCSVFromText(tableName, text);
    } catch (err) {
      console.error('Failed to fetch CSV:', err);
      throw new Error(`Failed to load CSV from ${url}: ${err}`);
    }
  }

  async loadParquet(tableName: string, url: string): Promise<void> {
    await this.ensureInitialized();
    const query = `CREATE TABLE IF NOT EXISTS "${tableName}" AS SELECT * FROM read_parquet('${url}')`;
    await this.exec(query);
  }

  async loadJSON(tableName: string, url: string): Promise<void> {
    await this.ensureInitialized();
    const query = `CREATE TABLE IF NOT EXISTS "${tableName}" AS SELECT * FROM read_json('${url}', auto_detect=true)`;
    await this.exec(query);
  }

  async getTables(): Promise<string[]> {
    await this.ensureInitialized();
    const result = await this.query<{ name: string }>(`
      SELECT table_name as name 
      FROM information_schema.tables 
      WHERE table_schema = 'main'
    `);
    return result.map((r) => r.name);
  }

  async getTableInfo(tableName: string): Promise<TableInfo> {
    await this.ensureInitialized();
    
    const columns = await this.query<{ column_name: string; data_type: string; is_nullable: string }>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `);

    const countResult = await this.query<{ count: number }>(`
      SELECT COUNT(*) as count FROM "${tableName}"
    `);

    const columnInfos: ColumnInfo[] = columns.map((col) => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
    }));

    return {
      name: tableName,
      columns: columnInfos,
      rowCount: countResult[0]?.count ?? 0,
    };
  }

  async getTablePreview(tableName: string, limit = 100): Promise<Record<string, unknown>[]> {
    await this.ensureInitialized();
    return this.query(`SELECT * FROM "${tableName}" LIMIT ${limit}`);
  }

  async dropTable(tableName: string): Promise<void> {
    await this.ensureInitialized();
    await this.exec(`DROP TABLE IF EXISTS "${tableName}"`);
  }

  getCoordinator() {
    return coordinator();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConnectorType(): DataSourceType {
    return this.connectorType;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

export const mosaicConnector = new MosaicConnectorService();
