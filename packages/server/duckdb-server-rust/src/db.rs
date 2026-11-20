use anyhow::Result;
use async_trait::async_trait;
use duckdb::DuckdbConnectionManager;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::{Mutex as AsyncMutex, OnceCell};

#[async_trait]
pub trait Database: Send + Sync {
    async fn execute(&self, sql: &str) -> Result<()>;
    async fn get_arrow(&self, sql: &str) -> Result<Vec<u8>>;
    /// Materialize a SELECT query and return the table's name parts.
    async fn preagg(&self, sql: &str) -> Result<Vec<String>>;
}

pub struct ConnectionPool {
    pool: r2d2::Pool<DuckdbConnectionManager>,
    schema: OnceCell<()>,
    builds: Mutex<HashMap<String, Arc<AsyncMutex<()>>>>,
}

impl ConnectionPool {
    pub fn new(db_path: &str, pool_size: u32) -> Result<Self> {
        let manager = DuckdbConnectionManager::file(db_path)?;
        let pool = r2d2::Pool::builder().max_size(pool_size).build(manager)?;
        Ok(Self {
            pool,
            schema: OnceCell::new(),
            builds: Mutex::default(),
        })
    }

    pub fn get(&self) -> Result<r2d2::PooledConnection<DuckdbConnectionManager>> {
        Ok(self.pool.get()?)
    }
}

#[async_trait]
impl Database for ConnectionPool {
    async fn execute(&self, sql: &str) -> Result<()> {
        let conn = self.get()?;
        conn.execute_batch(sql)?;
        Ok(())
    }

    async fn get_arrow(&self, sql: &str) -> Result<Vec<u8>> {
        let conn = self.get()?;
        let mut stmt = conn.prepare(sql)?;
        let arrow = stmt.query_arrow([])?;
        let schema = arrow.get_schema();

        let mut buffer: Vec<u8> = Vec::new();
        {
            let schema_ref = schema.as_ref();
            let mut writer = arrow::ipc::writer::FileWriter::try_new(&mut buffer, schema_ref)?;

            for batch in arrow {
                writer.write(&batch)?;
            }

            writer.finish()?;
        }

        Ok(buffer)
    }

    async fn preagg(&self, sql: &str) -> Result<Vec<String>> {
        let (catalog, hash): (String, String) =
            self.get()?
                .query_row("SELECT current_database(), sha256(?)", [sql], |row| {
                    Ok((row.get(0)?, row.get(1)?))
                })?;
        let table = format!("preagg_{}", &hash[..16]);

        // Concurrent creates of the same catalog entry on pooled connections
        // fail with a DuckDB write-write conflict, so each name builds once.
        self.schema
            .get_or_try_init(|| self.execute("CREATE SCHEMA IF NOT EXISTS mosaic"))
            .await?;
        let build = self
            .builds
            .lock()
            .unwrap()
            .entry(table.clone())
            .or_default()
            .clone();
        let _guard = build.lock().await;
        self.execute(&format!(
            "CREATE TABLE IF NOT EXISTS mosaic.\"{table}\" AS {sql}"
        ))
        .await?;

        Ok(vec![catalog, "mosaic".to_string(), table])
    }
}
