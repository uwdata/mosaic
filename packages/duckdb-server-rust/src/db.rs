use anyhow::Result;
use async_trait::async_trait;
use duckdb::{arrow::array::RecordBatch, Connection};
use std::sync::Arc;
use tokio::sync::Mutex;

#[async_trait]
pub trait Database: Send + Sync {
    async fn execute(&self, sql: &str) -> Result<()>;
    async fn get_json(&self, sql: &str) -> Result<Vec<u8>>;
    async fn get_arrow_bytes(&self, sql: &str) -> Result<Vec<u8>>;
}

pub struct DuckDbDatabase {
    con: Arc<Mutex<Connection>>,
}

impl DuckDbDatabase {
    pub fn new(con: Connection) -> Self {
        Self {
            con: Arc::new(Mutex::new(con)),
        }
    }
}

#[async_trait]
impl Database for DuckDbDatabase {
    async fn execute(&self, sql: &str) -> Result<()> {
        let conn = self.con.lock().await;
        conn.execute_batch(sql)?;
        Ok(())
    }

    async fn get_json(&self, sql: &str) -> Result<Vec<u8>> {
        let conn = self.con.lock().await;
        let mut stmt = conn.prepare(sql)?;
        let arrow = stmt.query_arrow([])?;

        let buf = Vec::new();
        let mut writer = arrow::json::ArrayWriter::new(buf);
        for batch in arrow {
            writer.write(&batch)?;
        }
        writer.finish()?;
        let json_data = writer.into_inner();
        Ok(json_data)
    }

    async fn get_arrow_bytes(&self, sql: &str) -> Result<Vec<u8>> {
        let conn = self.con.lock().await;
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
}
